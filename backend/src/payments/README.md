# Payments Module

## Overview

The Payments module handles the integration with PayU payment gateway for processing pack purchases in the Shuggi platform. It manages payment URL generation, webhook confirmations, and payment status tracking.

## Features

- **PayU Integration**: Direct integration with PayU's payment gateway for Colombian market
- **Secure Signatures**: MD5 signature generation and validation for all payment requests
- **Webhook Handling**: Automated payment confirmation via PayU webhooks
- **Multiple Payment States**: Support for APPROVED, DECLINED, PENDING, and EXPIRED transactions
- **HTML Auto-Submit Forms**: Seamless redirect to PayU checkout with pre-filled payment data

## Architecture

### Service Layer (`payments.service.ts`)

The service handles all PayU-related business logic:

- **Payment URL Generation**: Creates secure payment forms with MD5 signatures
- **Signature Validation**: Verifies webhook authenticity to prevent fraud
- **Webhook Processing**: Updates order status based on PayU confirmations
- **Payment Status Queries**: Retrieves current payment state for orders

### Controller Layer (`payments.controller.ts`)

Exposes REST endpoints for payment operations:

- `POST /payments/generate-payment`: Returns JSON payment data
- `POST /payments/checkout/:orderId`: Returns HTML form that auto-submits to PayU
- `POST /payments/webhook`: Receives PayU payment confirmations (no authentication)
- `GET /payments/status/:orderId`: Checks payment status for an order

### DTOs

- `PayUPaymentRequestDto`: Request to initiate payment for an order
- `PayUWebhookDto`: PayU webhook payload structure

## Configuration

### Environment Variables

Required variables in `.env`:
```env
# PayU Credentials
PAYU_MERCHANT_ID=508029
PAYU_ACCOUNT_ID=512321
PAYU_API_KEY=4Vj8eK4rloUd272L48hsrarnUA
PAYU_API_LOGIN=pRRXKOl8ikMmt9u
PAYU_PUBLIC_KEY=PKaC6H4cEDJD919n705L544kSU
PAYU_TEST_MODE=true

# PayU URLs
PAYU_PAYMENT_URL=https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/
PAYU_CONFIRMATION_URL=http://localhost:3000/payments/webhook
PAYU_RESPONSE_URL=http://localhost:4200/orders/payment-result

# Payment Gateway Fees
PAYMENT_GATEWAY_PERCENTAGE_FEE=0.0392  # 3.92% (3.29% + 19% VAT)
PAYMENT_GATEWAY_FIXED_FEE=300          # 300 COP per transaction
```

## Payment Flow

### 1. User Creates Order
```
User → POST /orders → Order created with status PENDING_PAYMENT
```

### 2. Generate Payment URL
```
User → POST /payments/checkout/:orderId
     → Backend generates signed payment form
     → Returns HTML that auto-submits to PayU
```

### 3. User Pays on PayU
```
User redirected to PayU → Enters payment details → Completes transaction
```

### 4. PayU Sends Webhook
```
PayU → POST /payments/webhook
     → Backend validates signature
     → Updates order to CONFIRMED (if approved)
```

### 5. User Redirected Back
```
PayU → Redirects to PAYU_RESPONSE_URL (frontend)
     → Frontend shows payment result
```

## Security

### Signature Generation

Payment requests use MD5 signatures to prevent tampering:
```
MD5(apiKey~merchantId~referenceCode~amount~currency)
```

### Webhook Validation

Incoming webhooks are validated using:
```
MD5(apiKey~merchantId~referenceCode~amount~currency~state)
```

If signature doesn't match, webhook is rejected to prevent fraud.

## Testing

### Test Cards (PayU Sandbox)

**Approved Transaction:**
- Card: `4097440000000004`
- CVV: `123`
- Expiry: Any future date
- Name: `APPROVED`

**Declined Transaction:**
- Card: `4097379999999000`
- CVV: `123`
- Expiry: Any future date
- Name: `REJECTED`

**Pending Transaction:**
- Card: `4097370000000002`
- CVV: `123`
- Expiry: Any future date
- Name: `PENDING`

### Testing Locally

**Important**: PayU webhooks cannot reach localhost. For full webhook testing, you need:

1. **Using ngrok** (recommended):
```bash
   ngrok http 3000
```
   Then update `PAYU_CONFIRMATION_URL` with the ngrok URL.

2. **Deploy to public server**: Use Heroku, Railway, or similar.

3. **Manual simulation**: Use the test endpoint to simulate payment confirmation:
```
   POST /orders/:id/simulate-payment (ADMIN only)
```

## Payment States

| State | Code | Description |
|-------|------|-------------|
| APPROVED | 4 | Payment successful, order confirmed |
| DECLINED | 6 | Payment rejected by bank or gateway |
| EXPIRED | 5 | Payment session expired |
| PENDING | 7 | Payment in process, awaiting confirmation |

## Error Handling

### Common Errors

**Invalid Signature**
- Cause: Webhook signature doesn't match calculated signature
- Action: Webhook is rejected, no order update
- Log: "Invalid signature - possible fraud attempt"

**Invalid Merchant**
- Cause: Merchant ID in webhook doesn't match configured ID
- Action: Webhook is rejected
- Log: "Invalid merchant ID"

**Order Not Found**
- Cause: Reference code in webhook doesn't match any order
- Action: Webhook processing fails
- Log: Error thrown by OrdersService

## Dependencies

- `crypto`: For MD5 signature generation
- `OrdersModule`: To update order status after payment
- `ConfigModule`: To load PayU credentials from environment

## Integration Points

### With Orders Module

The Payments module depends on OrdersModule to:
- Retrieve order details for payment generation
- Update order status after payment confirmation
- Validate order ownership and status

### With Frontend

Expected frontend routes:
- `PAYU_RESPONSE_URL`: Where users are redirected after payment
  - Should handle query params from PayU (transaction status, reference, etc.)
  - Display payment result to user

## Production Checklist

Before going to production:

- [ ] Switch `PAYU_TEST_MODE` to `false`
- [ ] Update PayU credentials to production keys
- [ ] Set `PAYU_CONFIRMATION_URL` to public server URL
- [ ] Set `PAYU_RESPONSE_URL` to production frontend URL
- [ ] Remove or protect test endpoints (simulate-payment)
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set up monitoring for failed webhooks
- [ ] Configure payment retry logic
- [ ] Test all payment scenarios with real bank cards

## Known Limitations

1. **Localhost Webhooks**: PayU cannot send webhooks to localhost during development
2. **Single Gateway**: Currently only supports PayU, no multi-gateway support
3. **No Retry Logic**: Failed payment confirmations require manual intervention
4. **Synchronous Processing**: Webhook processing is synchronous, may timeout on slow operations

## Future Enhancements

- [ ] Support for multiple payment gateways (Stripe, MercadoPago)
- [ ] Automatic payment retry on webhook failures
- [ ] Payment reconciliation reports
- [ ] Refund processing via API
- [ ] Subscription/recurring payments
- [ ] Split payments between platform and store
- [ ] Payment analytics dashboard

## Support

For PayU integration issues:
- Documentation: https://developers.payulatam.com/
- Support: integraciones@payulatam.com

For Shuggi-specific payment issues:
- Check logs for signature validation errors
- Verify environment variables are correctly set
- Ensure webhook URL is publicly accessible
- Test with sandbox cards before using real cards