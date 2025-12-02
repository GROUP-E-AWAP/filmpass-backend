import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes.js";
import moviesRoutes from "./modules/movies/movies.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import showtimeSeatsRoutes from "./modules/bookings/seats.routes.js";
import theatersRoutes from "./modules/theaters/theaters.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

/**
 * Create and configure the main Express application.
 * Registers global middleware and all feature modules.
 */
export function createApp() {
  const app = express();

  // Standard security & utility middleware
  app.use(cors());          // Enable CORS for frontend requests
  app.use(express.json());  // Parse JSON request bodies
  app.use(helmet());        // Basic security headers

  // Health-check endpoint for monitoring / debugging
  app.get("/health", (req, res) => res.json({ ok: true }));

  // Public routes
  app.use("/auth", authRoutes);
  app.use("/movies", moviesRoutes);
  app.use("/bookings", bookingsRoutes);
  app.use("/showtimes", showtimeSeatsRoutes);
  app.use("/theaters", theatersRoutes);

  // Admin routes – protected by JWT + role check
  app.use("/admin", requireAuth, requireRole("admin"), adminRoutes);

  // Global error handler (placed last)
  app.use(errorHandler);

  return app;
}
