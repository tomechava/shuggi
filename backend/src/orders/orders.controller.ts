import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
    CreateOrderDto,
    CancelOrderDto,
    ConfirmPickupDto,
    OrderFiltersDto,
    UpdateOrderStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { StoresService } from '../stores/stores.service';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly storesService: StoresService,
    ) { }

    /**
     * USER: Create order (reserve pack)
     * POST /orders
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN) // STORE users cannot buy packs
    async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
        return this.ordersService.create(createOrderDto, req.user.id);
    }

    /**
     * USER: Get my orders
     * GET /orders/my-orders
     */
    @Get('my-orders')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async getMyOrders(@Request() req) {
        return this.ordersService.findByUser(req.user.id);
    }

    /**
     * USER: Get order by ID
     * GET /orders/:id
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async getOrder(@Param('id') id: string, @Request() req) {
        return this.ordersService.findById(id, req.user.id);
    }

    /**
     * USER: Cancel order
     * PATCH /orders/:id/cancel
     */
    @Patch(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async cancelOrder(
        @Param('id') id: string,
        @Body() cancelDto: CancelOrderDto,
        @Request() req,
    ) {
        return this.ordersService.cancel(id, req.user.id, cancelDto);
    }

    /**
     * STORE: Get orders for my store
     * GET /orders/store/my-orders
     */
    @Get('store/my-orders')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async getStoreOrders(@Request() req, @Query() filters: OrderFiltersDto) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.ordersService.findByStore(store._id.toString(), filters);
    }

    /**
     * STORE: Confirm pickup with code
     * POST /orders/store/confirm-pickup
     */
    @Post('store/confirm-pickup')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.STORE)
    async confirmPickup(
        @Body() confirmPickupDto: ConfirmPickupDto,
        @Request() req,
    ) {
        const store = await this.storesService.findByOwner(req.user.id);
        return this.ordersService.confirmPickup(
            confirmPickupDto.pickupCode,
            store._id.toString(),
        );
    }

    /**
     * ADMIN: Get all orders with filters
     * GET /orders/admin/all
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAllOrders(@Query() filters: OrderFiltersDto) {
        return this.ordersService.findAllAdmin(filters);
    }

    /**
 * ADMIN: Get order by ID
 * GET /orders/admin/:id
 */
    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getOrderByIdAdmin(@Param('id') id: string) {
        return this.ordersService.findByIdAdmin(id);
    }

    /**
     * ADMIN: Update order status
     * PATCH /orders/admin/:id/status
     */
    @Patch('admin/:id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async updateOrderStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
    ) {
        return this.ordersService.updateStatus(id, updateStatusDto);
    }

    /**
 * TESTING ONLY: Simulate payment confirmation
 * POST /orders/:id/simulate-payment
 * TODO: Remove in production - this will be replaced by PayU webhook
 */
    @Post(':id/simulate-payment')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async simulatePayment(@Param('id') id: string) {
        const mockTransactionId = `PAYU-TEST-${Date.now()}`;
        const mockResponse = {
            state_pol: 4, // APPROVED
            response_code_pol: 1,
            reference_sale: id,
            transaction_date: new Date().toISOString(),
        };

        return this.ordersService.markAsPaid(id, mockTransactionId, mockResponse);
    }

    /**
     * SYSTEM: Expire unpaid orders (for cron job testing)
     * POST /orders/system/expire-unpaid
     * TODO: Protect with API key or remove in production
     */
    @Post('system/expire-unpaid')
    async expireUnpaidOrders() {
        const count = await this.ordersService.expireUnpaidOrders();
        return { message: `${count} orders expired` };
    }

    /**
     * SYSTEM: Mark no-shows (for cron job testing)
     * POST /orders/system/mark-no-shows
     * TODO: Protect with API key or remove in production
     */
    @Post('system/mark-no-shows')
    async markNoShows() {
        const count = await this.ordersService.markNoShows();
        return { message: `${count} orders marked as NO_SHOW` };
    }

}