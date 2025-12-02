import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import {
  createAuditoriumSchema,
  createEmployeeSchema,
  createMovieSchema,
  createShowtimeSchema,
  createTheaterSchema
} from "../../validation/adminSchemas.js";
import {
  adminCreateAuditoriumController,
  adminCreateEmployeeController,
  adminCreateMovieController,
  adminCreateShowtimeController,
  adminCreateTheaterController,
  adminListAuditoriumsController,
  adminListBookingsController,
  adminListEmployeesController,
  adminListMoviesController,
  adminListTheatersController
} from "./admin.controller.js";

const router = Router();

/**
 * Routes for managing theaters (admin only).
 * GET returns list of theaters.
 * POST creates a new theater (with schema validation).
 */
router.get("/theaters", adminListTheatersController);
router.post("/theaters", validate(createTheaterSchema), adminCreateTheaterController);

/**
 * Routes for auditoriums inside theaters.
 * GET lists all auditoriums for a given theater.
 * POST creates a new auditorium.
 */
router.get("/theaters/:theaterId/auditoriums", adminListAuditoriumsController);
router.post("/auditoriums", validate(createAuditoriumSchema), adminCreateAuditoriumController);

/**
 * Movie management.
 * GET lists available movies.
 * POST adds a new movie.
 */
router.get("/movies", adminListMoviesController);
router.post("/movies", validate(createMovieSchema), adminCreateMovieController);

/**
 * Creating showtimes (movie screenings).
 * Only POST since showtimes are created by admin.
 */
router.post("/showtimes", validate(createShowtimeSchema), adminCreateShowtimeController);

/**
 * Employee management.
 * GET lists employees with their assigned theaters.
 * POST creates a new employee user.
 */
router.get("/employees", adminListEmployeesController);
router.post("/employees", validate(createEmployeeSchema), adminCreateEmployeeController);

/**
 * Booking history and filtering.
 * Supports optional query params (theaterId, dates).
 */
router.get("/bookings", adminListBookingsController);

export default router;
