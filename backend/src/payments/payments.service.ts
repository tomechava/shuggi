import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly merchantId: string;
    private readonly accountId: string;
    private readonly apiKey: string;
    private readonly apiLogin: string;
    private readonly publicKey: string;
    private readonly testMode: boolean;
    private readonly paymentUrl: string;
    private readonly confirmationUrl: string;
    private readonly responseUrl: string;

    constructor(
        private configService: ConfigService,
        private ordersService: OrdersService,
    ) {
        // Load PayU configuration
        this.merchantId = this.configService.get<string>('PAYU_MERCHANT_ID')!;
        this.accountId = this.configService.get<string>('PAYU_ACCOUNT_ID')!;
        this.apiKey = this.configService.get<string>('PAYU_API_KEY')!;
        this.apiLogin = this.configService.get<string>('PAYU_API_LOGIN')!;
        this.publicKey = this.configService.get<string>('PAYU_PUBLIC_KEY')!;
        this.testMode = this.configService.get<boolean>('PAYU_TEST_MODE', true);
        this.paymentUrl = this.configService.get<string>('PAYU_PAYMENT_URL')!;
        this.confirmationUrl = this.configService.get<string>('PAYU_CONFIRMATION_URL')!;
        this.responseUrl = this.configService.get<string>('PAYU_RESPONSE_URL')!;

        // Logs de verificación (QUITAR DESPUÉS)
        /*
        console.log('PayU Config Loaded:');
        console.log('  Merchant ID:', this.merchantId);
        console.log('  Account ID:', this.accountId);
        console.log('  Test Mode:', this.testMode);
        console.log('  Payment URL:', this.paymentUrl);
        */
    }

    /**
     * Generate PayU signature for payment request
     */
    private generateSignature(
        referenceCode: string,
        amount: number,
        currency: string = 'COP',
    ): string {
        // PayU signature: md5(apiKey~merchantId~referenceCode~amount~currency)
        const signatureString = `${this.apiKey}~${this.merchantId}~${referenceCode}~${amount}~${currency}`;
        return createHash('md5').update(signatureString).digest('hex');
    }

    /**
     * Validate PayU webhook signature
     */
    private validateWebhookSignature(
        referenceCode: string,
        amount: number,
        currency: string,
        state: string,
        receivedSignature: string,
    ): boolean {
        // PayU confirmation signature: md5(apiKey~merchantId~referenceCode~amount~currency~state_pol)
        const signatureString = `${this.apiKey}~${this.merchantId}~${referenceCode}~${amount}.00~${currency}~${state}`;
        const calculatedSignature = createHash('md5').update(signatureString).digest('hex');

        this.logger.debug(`Signature validation:`);
        this.logger.debug(`  String: ${signatureString}`);
        this.logger.debug(`  Calculated: ${calculatedSignature}`);
        this.logger.debug(`  Received: ${receivedSignature}`);

        return calculatedSignature === receivedSignature;
    }

    /**
     * Generate PayU payment form data
     */
    async generatePaymentUrl(orderId: string, userId: string): Promise<any> {
        // Get order details
        const order = await this.ordersService.findById(orderId, userId);

        // Validate order status
        if (order.status !== 'PENDING_PAYMENT') {
            throw new BadRequestException('Order is not pending payment');
        }

        // Check if payment hasn't expired
        if (!order.paymentExpiresAt || new Date() > new Date(order.paymentExpiresAt)) {
            throw new BadRequestException('Payment time has expired (15 minutes)');
        }

        // Generate signature
        const referenceCode = orderId;
        const amount = order.totalAmount;
        const signature = this.generateSignature(referenceCode, amount);

        // Build payment form data
        const paymentData = {
            // URLs
            paymentUrl: this.paymentUrl,
            confirmationUrl: this.confirmationUrl,
            responseUrl: this.responseUrl,

            // Merchant info
            merchantId: this.merchantId,
            accountId: this.accountId,

            // Transaction info
            referenceCode,
            description: `Shuggi Order ${orderId} - ${(order as any).pack?.name || 'Magic Bag'}`,
            amount: amount.toString(),
            tax: '0',
            taxReturnBase: '0',
            currency: 'COP',
            signature,

            // Test mode
            test: this.testMode ? '1' : '0',

            // Buyer info (from order user)
            buyerEmail: (order as any).user?.email || 'buyer@shuggi.com',
            buyerFullName: (order as any).user?.name || 'Shuggi User',

            // Additional info
            extra1: orderId, // Para tracking
            extra2: userId,

            // Response page language
            lng: 'es',
        };

        this.logger.log(`Payment URL generated for order ${orderId}`);
        this.logger.debug(`Payment data: ${JSON.stringify(paymentData, null, 2)}`);

        return paymentData;
    }

    /**
     * Process PayU webhook confirmation
     */
    async processWebhook(webhookData: any): Promise<{ success: boolean; message: string }> {
        this.logger.log('Processing PayU webhook...');
        this.logger.debug(`Webhook data: ${JSON.stringify(webhookData, null, 2)}`);

        try {
            // Extract data
            const {
                merchant_id,
                state_pol,
                reference_sale: orderId,
                reference_pol,
                sign: receivedSignature,
                transaction_id,
                value,
                currency = 'COP',
                response_code_pol,
                payment_method_type,
            } = webhookData;

            // Validate merchant ID
            if (merchant_id !== this.merchantId) {
                this.logger.warn(`Invalid merchant ID: ${merchant_id}`);
                return { success: false, message: 'Invalid merchant' };
            }

            // Validate signature
            const isValidSignature = this.validateWebhookSignature(
                orderId,
                parseFloat(value),
                currency,
                state_pol,
                receivedSignature,
            );

            if (!isValidSignature) {
                this.logger.error('Invalid signature - possible fraud attempt');
                return { success: false, message: 'Invalid signature' };
            }

            // Process based on state_pol
            // state_pol values:
            // 4 = APPROVED
            // 6 = DECLINED
            // 5 = EXPIRED
            // 7 = PENDING

            switch (state_pol) {
                case '4': // APPROVED
                    this.logger.log(`Payment APPROVED for order ${orderId}`);
                    await this.ordersService.markAsPaid(orderId, transaction_id, webhookData);
                    return { success: true, message: 'Payment confirmed' };

                case '6': // DECLINED
                    this.logger.warn(`Payment DECLINED for order ${orderId}`);
                    // TODO: Update order status to PAYMENT_FAILED
                    // TODO: Release pack quantity
                    return { success: true, message: 'Payment declined' };

                case '7': // PENDING
                    this.logger.log(`Payment PENDING for order ${orderId}`);
                    // TODO: Update order status to PAYMENT_PROCESSING
                    return { success: true, message: 'Payment pending' };

                case '5': // EXPIRED
                    this.logger.warn(`Payment EXPIRED for order ${orderId}`);
                    // TODO: Mark order as expired
                    return { success: true, message: 'Payment expired' };

                default:
                    this.logger.warn(`Unknown payment state: ${state_pol}`);
                    return { success: true, message: 'Payment status unknown' };
            }
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`);
            this.logger.error(error.stack);
            return { success: false, message: error.message };
        }
    }

    /**
     * Get payment status for an order
     */
    async getPaymentStatus(orderId: string, userId: string): Promise<any> {
        const order = await this.ordersService.findById(orderId, userId);

        return {
            orderId: orderId,
            status: order.status,
            paymentStatus: order.paymentStatus,
            totalAmount: order.totalAmount,
            paidAt: order.paidAt,
            paymentGatewayTransactionId: order.paymentGatewayTransactionId,
        };
    }
}