import dotenv from "dotenv";

dotenv.config();

// Read JWT secret from environment variables.
// Used for signing and verifying authentication tokens.
// A fallback value is provided for development only.
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Email service configuration
export const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || "gmail",
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  fromName: process.env.EMAIL_FROM_NAME || "Filmpass Cinema",
};
