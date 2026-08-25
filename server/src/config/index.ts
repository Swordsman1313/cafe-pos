import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/cafepos?schema=public",
  jwtSecret: process.env.JWT_SECRET || "super-secret-jwt-key-for-cafe-pos-saas-2026",
  jwtExpiresIn: "12h",
  khrExchangeRate: parseFloat(process.env.KHR_EXCHANGE_RATE || "4000"),
  defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || "0.10"),
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "khqr-webhook-signature-secret-key-32chars",
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:5173", "http://localhost:3000", "*"],
};
