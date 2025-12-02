import { JWT_SECRET } from "./config/env.js";
import { createApp } from "./app.js";
import { pool } from "./config/db.js";

const PORT = process.env.PORT || 8080;
const app = createApp();

/**
 * Start HTTP server and perform basic startup diagnostics:
 *  - Print DB config (safe subset)
 *  - Confirm JWT secret presence
 *  - Run a simple DB health check query
 */
app.listen(PORT, () => {
  console.log("DB config:", {
    host: process.env.DB_HOST,
    db: process.env.DB_NAME,
    user: process.env.DB_USER,
    ssl: process.env.DB_SSL
  });

  console.log(`API listening on http://localhost:${PORT}`);
  console.log("JWT secret loaded:", process.env.JWT_SECRET ? "OK" : "MISSING");

  // Simple database connectivity test
  pool
    .query("SELECT 1 AS ok")
    .then(r => {
      const row = r.rows[0];
      console.log("DB health check ok:", row);
    })
    .catch(err => {
      console.error("DB health check failed:", err.message);
    });
});
