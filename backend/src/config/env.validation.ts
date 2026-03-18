import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App Configuration
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  // Database
  MONGO_URI: Joi.string().required(),

  // JWT & Security
  JWT_SECRET: Joi.string().required(),

  // Pack Configuration
  MIN_DISCOUNT_PERCENTAGE: Joi.number().required(),
  MAX_DISCOUNT_PERCENTAGE: Joi.number().required(),
  PLATFORM_COMMISSION_RATE: Joi.number().required(),
  MAX_ADVANCE_DAYS: Joi.number().required(),
  MAX_ACTIVE_PACKS: Joi.number().required(),
  MAX_PACKS_PER_DAY: Joi.number().required(),

  // Payment Gateway
  PAYMENT_GATEWAY: Joi.string().required(),
  PAYMENT_GATEWAY_PERCENTAGE_FEE: Joi.number().required(),
  PAYMENT_GATEWAY_FIXED_FEE: Joi.number().required(),
  MINIMUM_TRANSACTION_AMOUNT: Joi.number().required(),

  // Order Configuration
  PAYMENT_TIMEOUT_MINUTES: Joi.number().required(),
  FREE_CANCELLATION_HOURS: Joi.number().required(),

  // PayU Configuration
  PAYU_MERCHANT_ID: Joi.string().required(),
  PAYU_ACCOUNT_ID: Joi.string().required(),
  PAYU_API_KEY: Joi.string().required(),
  PAYU_API_LOGIN: Joi.string().required(),
  PAYU_PUBLIC_KEY: Joi.string().required(),
  PAYU_TEST_MODE: Joi.boolean().default(true),
  PAYU_PAYMENT_URL: Joi.string().uri().required(),
  PAYU_CONFIRMATION_URL: Joi.string().uri().required(),
  PAYU_RESPONSE_URL: Joi.string().uri().required(),

  // CORS
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:4200'),

  // Email Configuration
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
}).unknown(true);
