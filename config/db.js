import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

// Create a reusable PostgreSQL connection pool.
// All API modules will use this pool to execute queries.
// Environment variables are defined in the .env file.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,  // Default port for PostgreSQL
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // SSL support for remote/cloud databases.
  // When DB_SSL is "true", SSL is enabled with relaxed certificate checks.
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

// Helper function to execute SQL queries through the shared pool.
// Improves readability and keeps DB access consistent across the project.
export function query(text, params) {
  return pool.query(text, params);
}
