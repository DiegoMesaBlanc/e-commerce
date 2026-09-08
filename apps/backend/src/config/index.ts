import 'dotenv/config';

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isNaN(value) ? fallback : value;
}

function stringFromEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  server: {
    port: numberFromEnv('SERVER_PORT', 3000),
  },
  database: {
    mongodbUri: stringFromEnv('MONGODB_URI', 'mongodb://localhost:27017/ecommerce'),
  },
  discounts: {
    categoryRate: numberFromEnv('DISCOUNT_CATEGORY_RATE', 0.1),
    volumeRate: numberFromEnv('DISCOUNT_VOLUME_RATE', 0.05),
    volumeThreshold: numberFromEnv('DISCOUNT_VOLUME_THRESHOLD', 100),
    couponRate: numberFromEnv('DISCOUNT_COUPON_RATE', 0.15),
    couponCode: stringFromEnv('DISCOUNT_COUPON_CODE', 'WELCOME2026'),
    maxRate: numberFromEnv('DISCOUNT_MAX_RATE', 0.35),
  },
};