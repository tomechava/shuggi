import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    Logger,
    Res,
    Req,
    RawBodyRequest,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayUPaymentRequestDto, PayUWebhookDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(private readonly paymentsService: PaymentsService) { }

    /**
     * USER: Generate PayU payment URL
     * POST /payments/generate-payment
     */
    @Post('generate-payment')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async generatePayment(
        @Body() paymentRequestDto: PayUPaymentRequestDto,
        @Request() req,
    ) {
        const paymentData = await this.paymentsService.generatePaymentUrl(
            paymentRequestDto.orderId,
            req.user.id,
        );

        return {
            success: true,
            message: 'Payment URL generated',
            data: paymentData,
        };
    }

    /**
     * USER: Generate PayU payment form (HTML auto-submit)
     * POST /payments/checkout/:orderId
     * Returns HTML form that auto-submits to PayU
     */
    @Post('checkout/:orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async checkout(
        @Param('orderId') orderId: string,
        @Request() req,
        @Res() res,
    ) {
        const paymentData = await this.paymentsService.generatePaymentUrl(
            orderId,
            req.user.id,
        );

        // Generate HTML form that auto-submits to PayU
        const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Redirigiendo a PayU...</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .loader {
        text-align: center;
        color: white;
      }
      .spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 4px solid white;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="loader">
      <div class="spinner"></div>
      <h2>Redirigiendo a PayU...</h2>
      <p>Por favor espera un momento</p>
    </div>
    <form id="payuForm" method="post" action="${paymentData.paymentUrl}">
      <input name="merchantId" type="hidden" value="${paymentData.merchantId}">
      <input name="accountId" type="hidden" value="${paymentData.accountId}">
      <input name="description" type="hidden" value="${paymentData.description}">
      <input name="referenceCode" type="hidden" value="${paymentData.referenceCode}">
      <input name="amount" type="hidden" value="${paymentData.amount}">
      <input name="tax" type="hidden" value="${paymentData.tax}">
      <input name="taxReturnBase" type="hidden" value="${paymentData.taxReturnBase}">
      <input name="currency" type="hidden" value="${paymentData.currency}">
      <input name="signature" type="hidden" value="${paymentData.signature}">
      <input name="test" type="hidden" value="${paymentData.test}">
      <input name="buyerEmail" type="hidden" value="${paymentData.buyerEmail}">
      <input name="buyerFullName" type="hidden" value="${paymentData.buyerFullName}">
      <input name="responseUrl" type="hidden" value="${paymentData.responseUrl}">
      <input name="confirmationUrl" type="hidden" value="${paymentData.confirmationUrl}">
      <input name="extra1" type="hidden" value="${paymentData.extra1}">
      <input name="extra2" type="hidden" value="${paymentData.extra2}">
      <input name="lng" type="hidden" value="${paymentData.lng}">
    </form>
    <script>
      document.getElementById('payuForm').submit();
    </script>
  </body>
  </html>
      `;

        res.send(html);
    }

    /**
     * WEBHOOK: PayU confirmation
     * POST /payments/webhook
     * This endpoint receives payment confirmations from PayU
     * NO AUTH - PayU calls this directly
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async webhook(@Body() webhookData: any, @Req() req) {
        this.logger.log('PayU webhook received');
        this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
        this.logger.debug(`Body: ${JSON.stringify(webhookData)}`);

        const result = await this.paymentsService.processWebhook(webhookData);

        // PayU expects 200 OK response
        return {
            success: result.success,
            message: result.message,
        };
    }

    /**
     * USER: Get payment status for an order
     * GET /payments/status/:orderId
     */
    @Get('status/:orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER, UserRole.ADMIN)
    async getPaymentStatus(@Param('orderId') orderId: string, @Request() req) {
        return this.paymentsService.getPaymentStatus(orderId, req.user.id);
    }
}