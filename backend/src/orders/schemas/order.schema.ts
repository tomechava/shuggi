import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',       // Creada, esperando pago (15 min)
    PAYMENT_PROCESSING = 'PAYMENT_PROCESSING', // Pago en proceso
    CONFIRMED = 'CONFIRMED',                   // Pagada, confirmada
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',     // Lista para recoger
    COMPLETED = 'COMPLETED',                   // Usuario recogió
    CANCELLED = 'CANCELLED',                   // Cancelada (con/sin penalización)
    EXPIRED = 'EXPIRED',                       // Expiró sin pago
    NO_SHOW = 'NO_SHOW',                       // Usuario no recogió
    REFUNDED = 'REFUNDED',                     // Reembolsada
}

export enum PaymentMethod {
    PAYU = 'payu',
    // Future: NEQUI = 'nequi', DAVIPLATA = 'daviplata'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class Order {
    // Relations
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Pack', required: true, index: true })
    pack: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
    store: Types.ObjectId;

    // Order details
    @Prop({ required: true })
    quantity: number; // Number of packs purchased (usually 1)

    // Pricing (snapshot at time of purchase)
    @Prop({ required: true })
    packOriginalPrice: number;

    @Prop({ required: true })
    packDiscountedPrice: number;

    @Prop({ required: true })
    totalAmount: number; // quantity × packDiscountedPrice

    @Prop({ required: true })
    platformCommission: number; // Shuggi's commission

    @Prop({ required: true })
    storeEarnings: number; // What store receives

    // Payment gateway fees
    @Prop({ required: true })
    paymentGatewayFee: number; // PayU fee

    @Prop({ required: true })
    netAmount: number; // totalAmount - paymentGatewayFee

    // Payment info
    @Prop({
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.PAYU,
    })
    paymentMethod: PaymentMethod;

    @Prop({
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING,
    })
    paymentStatus: PaymentStatus;

    @Prop()
    paymentGatewayTransactionId?: string; // PayU transaction ID

    @Prop()
    paymentGatewayResponse?: string; // JSON stringified response

    @Prop()
    paidAt?: Date;

    // Pickup details (from pack at time of purchase)
    @Prop({ required: true, type: Date })
    pickupDate: Date;

    @Prop({ required: true })
    pickupTimeStart: string;

    @Prop({ required: true })
    pickupTimeEnd: string;

    // QR Code for pickup
    @Prop({ unique: true, sparse: true })
    pickupCode: string; // 6-digit code or UUID

    @Prop()
    qrCodeUrl?: string; // URL to QR code image (S3)

    @Prop()
    pickedUpAt?: Date;

    // Status
    @Prop({
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING_PAYMENT,
        index: true,
    })
    status: OrderStatus;

    // Cancellation
    @Prop()
    cancelledAt?: Date;

    @Prop()
    cancellationReason?: string;

    @Prop({ default: 0 })
    cancellationPenalty: number; // Amount retained if cancelled late

    @Prop({ default: 0 })
    refundAmount: number; // Amount refunded to wallet

    // Wallet credit (if refunded)
    @Prop({ default: false })
    refundedToWallet: boolean;

    // Payment timeout (15 minutes)
    @Prop()
    paymentExpiresAt?: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for common queries
OrderSchema.index({ user: 1, status: 1 }); // User's orders by status
OrderSchema.index({ store: 1, pickupDate: 1 }); // Store's orders by date
OrderSchema.index({ pickupCode: 1 }); // Quick lookup for pickup
OrderSchema.index({ paymentExpiresAt: 1, status: 1 }); // Cleanup expired orders