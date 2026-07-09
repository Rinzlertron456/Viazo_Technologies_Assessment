import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/doctor-appointment",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access-secret-fallback",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "refresh-secret-fallback",
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@medibook.com",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  RECAPTCHA_ENABLED:
    process.env.RECAPTCHA_ENABLED === "true" ||
    Boolean(process.env.RECAPTCHA_SECRET),
  RECAPTCHA_SECRET: process.env.RECAPTCHA_SECRET || "",
} as const;
