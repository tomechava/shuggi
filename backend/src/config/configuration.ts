export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    env: process.env.NODE_ENV ?? 'development',
  },
  database: {
    mongoUri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  pack: {
    minDiscountPercentage: parseInt(process.env.MIN_DISCOUNT_PERCENTAGE ?? '40', 10),
    maxDiscountPercentage: parseInt(process.env.MAX_DISCOUNT_PERCENTAGE ?? '80', 10),
    platformCommissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? '0.10'),
    maxAdvanceDays: parseInt(process.env.MAX_ADVANCE_DAYS ?? '7', 10),
    maxActivePacks: parseInt(process.env.MAX_ACTIVE_PACKS ?? '14', 10),
    maxPacksPerDay: parseInt(process.env.MAX_PACKS_PER_DAY ?? '2', 10),
  },
  payment: {
    gateway: process.env.PAYMENT_GATEWAY ?? 'payu',
    gatewayPercentageFee: parseFloat(process.env.PAYMENT_GATEWAY_PERCENTAGE_FEE ?? '0.0392'),
    gatewayFixedFee: parseInt(process.env.PAYMENT_GATEWAY_FIXED_FEE ?? '300', 10),
    minimumTransactionAmount: parseInt(process.env.MINIMUM_TRANSACTION_AMOUNT ?? '10000', 10),
  },
  order: {
    paymentTimeoutMinutes: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES ?? '15', 10),
    freeCancellationHours: parseInt(process.env.FREE_CANCELLATION_HOURS ?? '24', 10),
  },
  payu: {
    merchantId: process.env.PAYU_MERCHANT_ID,
    accountId: process.env.PAYU_ACCOUNT_ID,
    apiKey: process.env.PAYU_API_KEY,
    apiLogin: process.env.PAYU_API_LOGIN,
    publicKey: process.env.PAYU_PUBLIC_KEY,
    testMode: process.env.PAYU_TEST_MODE === 'true',
    paymentUrl: process.env.PAYU_PAYMENT_URL,
    confirmationUrl: process.env.PAYU_CONFIRMATION_URL,
    responseUrl: process.env.PAYU_RESPONSE_URL,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:4200'],
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
});
  