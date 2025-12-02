import dotenv from "dotenv";

dotenv.config();

// Read JWT secret from environment variables.
// Used for signing and verifying authentication tokens.
// A fallback value is provided for development only.
export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
