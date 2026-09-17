import { z } from 'zod';

const boolFromString = z
  .union([z.literal('true'), z.literal('false'), z.undefined()])
  .transform((v) => v === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-char hex string (32 bytes)'),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),

  // The web app's OAuth client (Google Identity Services). Required.
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  // The mobile app's OAuth client (native Google Sign-In). iOS/Android need their own
  // client type, so this is a distinct id from GOOGLE_CLIENT_ID - both are accepted as
  // valid token audiences so web and mobile sign-in work at the same time.
  GOOGLE_MOBILE_CLIENT_ID: z.string().optional(),

  INSTAGRAM_MOCK_MODE: boolFromString,

  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_YEARLY: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_YEARLY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See errors above.');
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';

export const metaConfigured = Boolean(
  config.META_APP_ID && config.META_APP_SECRET && config.META_VERIFY_TOKEN,
);
export const stripeConfigured = Boolean(config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET);

if (!metaConfigured) {
  console.warn(
    '[config] Meta App credentials are not fully set — Instagram OAuth/webhooks will run in mock mode only.',
  );
}
if (!stripeConfigured) {
  console.warn(
    '[config] Stripe keys are not set — billing routes will return 503 until configured.',
  );
}
