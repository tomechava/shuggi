import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import {
    CreateOrderDto,
    CancelOrderDto,
    ConfirmPickupDto,
    OrderFiltersDto,
    UpdateOrderStatusDto,
} from './dto';

@Injectable()
export class OrdersService {
    private readonly paymentTimeoutMinutes: number;
    private readonly gatewayPercentageFee: number;
    private readonly gatewayFixedFee: number;
    private readonly platformCommissionRate: number;
    private readonly freeCancellationHours: number;

    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private configService: ConfigService,
    ) {
        // Load configuration
        this.paymentTimeoutMinutes = Number(this.configService.get<number>('PAYMENT_TIMEOUT_MINUTES', 15));
        this.gatewayPercentageFee = Number(this.configService.get<number>('PAYMENT_GATEWAY_PERCENTAGE_FEE', 0.0392));
        this.gatewayFixedFee = Number(this.configService.get<number>('PAYMENT_GATEWAY_FIXED_FEE', 300));
        this.platformCommissionRate = Number(this.configService.get<number>('PLATFORM_COMMISSION_RATE', 0.10));
        this.freeCancellationHours = Number(this.configService.get<number>('FREE_CANCELLATION_HOURS', 24));
    }

    /**
     * Calculate payment gateway fees
     */
    private calculatePaymentFees(amount: number) {
        const percentageFee = amount * this.gatewayPercentageFee;
        const totalFee = Math.round(percentageFee + this.gatewayFixedFee);

        return {
            paymentGatewayFee: totalFee,
            netAmount: amount - totalFee,
        };
    }

    /**
     * Generate unique 6-digit pickup code
     */
    private generatePickupCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Calculate cancellation penalty based on time until pickup
     */
    private calculateCancellationPenalty(
        pickupDate: Date,
        pickupTimeStart: string,
        totalAmount: number,
        paymentGatewayFee: number,
    ): { penalty: number; refund: number } {
        const now = new Date();

        // Parse pickup datetime
        const [hours, minutes] = pickupTimeStart.split(':').map(Number);
        const pickupDateTime = new Date(pickupDate);
        pickupDateTime.setUTCHours(hours, minutes, 0, 0);

        // Calculate hours until pickup
        const msUntilPickup = pickupDateTime.getTime() - now.getTime();
        const hoursUntilPickup = msUntilPickup / (1000 * 60 * 60);

        if (hoursUntilPickup > this.freeCancellationHours) {
            // Free cancellation - full refund
            return {
                penalty: 0,
                refund: totalAmount,
            };
        } else {
            // Late cancellation - retain payment gateway fee
            return {
                penalty: paymentGatewayFee,
                refund: totalAmount - paymentGatewayFee,
            };
        }
    }

    /**
     * USER: Create a new order (reserve pack)
     */
    async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
        const Pack = this.orderModel.db.model('Pack');

        // Get pack details
        const pack = await Pack.findById(createOrderDto.packId)
            .populate('store')
            .exec();

        if (!pack) {
            throw new NotFoundException('Pack not found');
        }

        // Validate pack is available
        if (pack.status !== 'AVAILABLE') {
            throw new BadRequestException('Pack is not available');
        }

        // Validate pack date hasn't passed
        const now = new Date();
        if (new Date(pack.availableDate) < now) {
            throw new BadRequestException('Pack date has passed');
        }

        // Validate quantity
        const quantity = createOrderDto.quantity || 1;
        const availableQuantity = pack.quantity - pack.quantityReserved;

        if (quantity > availableQuantity) {
            throw new BadRequestException(
                `Only ${availableQuantity} pack(s) available. Requested: ${quantity}`
            );
        }

        // Calculate pricing
        const totalAmount = pack.discountedPrice * quantity;
        const { paymentGatewayFee, netAmount } = this.calculatePaymentFees(totalAmount);

        // Platform commission and store earnings (from net amount after gateway fee)
        const platformCommission = Math.round(totalAmount * this.platformCommissionRate);
        const storeEarnings = netAmount - platformCommission;

        // Generate pickup code
        const pickupCode = this.generatePickupCode();

        // Calculate payment expiration (15 minutes from now)
        const paymentExpiresAt = new Date();
        paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + this.paymentTimeoutMinutes);

        // Create order
        const order = new this.orderModel({
            user: new Types.ObjectId(userId),
            pack: pack._id,
            store: pack.store._id,
            quantity,
            packOriginalPrice: pack.originalPrice,
            packDiscountedPrice: pack.discountedPrice,
            totalAmount,
            platformCommission,
            storeEarnings,
            paymentGatewayFee,
            netAmount,
            pickupDate: pack.availableDate,
            pickupTimeStart: pack.pickupTimeStart,
            pickupTimeEnd: pack.pickupTimeEnd,
            pickupCode,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            paymentExpiresAt,
        });

        await order.save();

        // Update pack's reserved quantity
        pack.quantityReserved += quantity;

        // Update pack status if sold out
        if (pack.quantityReserved >= pack.quantity) {
            pack.status = 'SOLD_OUT';
        }

        await pack.save();

        return order;
    }

    /**
     * SYSTEM: Mark order as paid (called by payment webhook in Sprint 5)
     */
    async markAsPaid(
        orderId: string,
        transactionId: string,
        gatewayResponse: any,
    ): Promise<OrderDocument> {
        const order = await this.orderModel.findById(orderId).exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException('Order is not pending payment');
        }

        order.status = OrderStatus.CONFIRMED;
        order.paymentStatus = PaymentStatus.APPROVED;
        order.paymentGatewayTransactionId = transactionId;
        order.paymentGatewayResponse = JSON.stringify(gatewayResponse);
        order.paidAt = new Date();

        return order.save();
    }

    /**
     * USER: Get my orders
     */
    async findByUser(userId: string): Promise<Order[]> {
        return this.orderModel
            .find({ user: new Types.ObjectId(userId) })
            .populate('pack', 'name description image')
            .populate('store', 'name address logo')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * USER: Get order by ID (if owns it)
     */
    async findById(orderId: string, userId: string): Promise<Order> {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestException('Invalid order ID');
        }

        const order = await this.orderModel
            .findOne({
                _id: orderId,
                user: new Types.ObjectId(userId),
            })
            .populate('pack', 'name description image dietaryInfo')
            .populate('store', 'name address contact location')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    /**
     * STORE: Get orders for my store
     */
    async findByStore(storeId: string, filters?: OrderFiltersDto): Promise<Order[]> {
        const query: any = {
            store: new Types.ObjectId(storeId),
        };

        // Apply filters
        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.pickupDate) {
            const date = new Date(filters.pickupDate);
            date.setUTCHours(0, 0, 0, 0);
            query.pickupDate = date;
        }

        if (filters?.fromDate || filters?.toDate) {
            query.pickupDate = {};
            if (filters.fromDate) {
                query.pickupDate.$gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                query.pickupDate.$lte = new Date(filters.toDate);
            }
        }

        return this.orderModel
            .find(query)
            .populate('user', 'name email')
            .populate('pack', 'name')
            .sort({ pickupDate: 1, pickupTimeStart: 1 })
            .exec();
    }

    /**
     * USER: Cancel order
     */
    async cancel(orderId: string, userId: string, cancelDto: CancelOrderDto): Promise<OrderDocument> {
        const order = await this.orderModel
            .findOne({
                _id: orderId,
                user: new Types.ObjectId(userId),
            })
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Can only cancel PENDING_PAYMENT or CONFIRMED orders
        if (![OrderStatus.PENDING_PAYMENT, OrderStatus.CONFIRMED].includes(order.status)) {
            throw new BadRequestException('Cannot cancel order in current status');
        }

        // If PENDING_PAYMENT, just cancel (no refund needed)
        if (order.status === OrderStatus.PENDING_PAYMENT) {
            order.status = OrderStatus.CANCELLED;
            order.cancelledAt = new Date();
            order.cancellationReason = cancelDto.reason || 'User cancelled before payment';

            // Release pack quantity
            const Pack = this.orderModel.db.model('Pack');
            await Pack.findByIdAndUpdate(order.pack, {
                $inc: { quantityReserved: -order.quantity },
            });

            return order.save();
        }

        // If CONFIRMED (already paid), calculate penalty
        const { penalty, refund } = this.calculateCancellationPenalty(
            order.pickupDate,
            order.pickupTimeStart,
            order.totalAmount,
            order.paymentGatewayFee,
        );

        order.status = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        order.cancellationReason = cancelDto.reason || 'User cancelled';
        order.cancellationPenalty = penalty;
        order.refundAmount = refund;

        // TODO Sprint 5: Add refund to user's wallet
        // await this.walletsService.addCredit(userId, refund, `Refund for order ${orderId}`);
        order.refundedToWallet = true;

        // Release pack quantity
        const Pack = this.orderModel.db.model('Pack');
        await Pack.findByIdAndUpdate(order.pack, {
            $inc: { quantityReserved: -order.quantity },
        });

        return order.save();
    }

    /**
     * STORE: Confirm pickup with code
     */
    async confirmPickup(pickupCode: string, storeId: string): Promise<OrderDocument> {
        const order = await this.orderModel
            .findOne({
                pickupCode,
                store: new Types.ObjectId(storeId),
            })
            .populate('user', 'name email')
            .populate('pack', 'name')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found with this pickup code');
        }

        // Validate order status
        if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.READY_FOR_PICKUP) {
            throw new BadRequestException(
                `Cannot confirm pickup. Order status: ${order.status}`
            );
        }

        // Validate pickup date (allow pickup on the day)
        const now = new Date();
        const pickupDate = new Date(order.pickupDate);
        pickupDate.setUTCHours(0, 0, 0, 0);
        now.setUTCHours(0, 0, 0, 0);

        if (now.getTime() !== pickupDate.getTime()) {
            throw new BadRequestException('Order can only be picked up on the scheduled date');
        }

        // Mark as completed
        order.status = OrderStatus.COMPLETED;
        order.pickedUpAt = new Date();

        return order.save();
    }

    /**
     * ADMIN: Get all orders with filters
     */
    async findAllAdmin(filters?: OrderFiltersDto): Promise<Order[]> {
        const query: any = {};

        if (filters?.userId) {
            query.user = new Types.ObjectId(filters.userId);
        }

        if (filters?.storeId) {
            query.store = new Types.ObjectId(filters.storeId);
        }

        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.pickupDate) {
            const date = new Date(filters.pickupDate);
            date.setUTCHours(0, 0, 0, 0);
            query.pickupDate = date;
        }

        return this.orderModel
            .find(query)
            .populate('user', 'name email')
            .populate('store', 'name')
            .populate('pack', 'name')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * ADMIN: Update order status
     */
    async updateStatus(
        orderId: string,
        updateStatusDto: UpdateOrderStatusDto,
    ): Promise<Order> {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new BadRequestException('Invalid order ID');
        }

        const order = await this.orderModel.findById(orderId).exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        order.status = updateStatusDto.status;

        // Add notes if provided
        if (updateStatusDto.notes) {
            order.cancellationReason = updateStatusDto.notes;
        }

        return order.save();
    }

    /**
     * SYSTEM: Expire orders that weren't paid in time
     */
    async expireUnpaidOrders(): Promise<number> {
        const now = new Date();

        const expiredOrders = await this.orderModel
            .find({
                status: OrderStatus.PENDING_PAYMENT,
                paymentExpiresAt: { $lt: now },
            })
            .exec();

        for (const order of expiredOrders) {
            order.status = OrderStatus.EXPIRED;
            await order.save();

            // Release pack quantity
            const Pack = this.orderModel.db.model('Pack');
            await Pack.findByIdAndUpdate(order.pack, {
                $inc: { quantityReserved: -order.quantity },
            });
        }

        return expiredOrders.length;
    }

    /**
     * SYSTEM: Mark orders as NO_SHOW if not picked up
     */
    async markNoShows(): Promise<number> {
        const now = new Date();

        const orders = await this.orderModel
            .find({
                status: { $in: [OrderStatus.CONFIRMED, OrderStatus.READY_FOR_PICKUP] },
                pickupDate: { $lt: now },
            })
            .exec();

        for (const order of orders) {
            // Check if pickup time has passed
            const pickupDateTime = new Date(order.pickupDate);
            const [hours, minutes] = order.pickupTimeEnd.split(':').map(Number);
            pickupDateTime.setUTCHours(hours, minutes, 0, 0);

            if (pickupDateTime < now) {
                order.status = OrderStatus.NO_SHOW;
                await order.save();
            }
        }

        return orders.length;
    }
}