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
  adminDeleteAuditoriumController,
  adminDeleteEmployeeController,
  adminDeleteMovieController,
  adminDeleteShowtimeController,
  adminDeleteTheaterController,
  adminListAuditoriumsController,
  adminListBookingsController,
  adminListEmployeesController,
  adminListMoviesController,
  adminListTheatersController,
  adminListShowtimesController
} from "./admin.controller.js";

const router = Router();

/**
 * Routes for managing theaters (admin only).
 * GET returns list of theaters.
 * POST creates a new theater (with schema validation).
 * DELETE removes a theater and all related data.
 */
router.get("/theaters", adminListTheatersController);
router.post("/theaters", validate(createTheaterSchema), adminCreateTheaterController);
router.delete("/theaters/:theaterId", adminDeleteTheaterController);

/**
 * Routes for auditoriums inside theaters.
 * GET lists all auditoriums for a given theater.
 * POST creates a new auditorium.
 * DELETE removes an auditorium and related data.
 */
router.get("/theaters/:theaterId/auditoriums", adminListAuditoriumsController);
router.post("/auditoriums", validate(createAuditoriumSchema), adminCreateAuditoriumController);
router.delete("/auditoriums/:auditoriumId", adminDeleteAuditoriumController);

/**
 * Movie management.
 * GET lists available movies.
 * POST adds a new movie.
 * DELETE removes a movie and related data.
 */
router.get("/movies", adminListMoviesController);
router.post("/movies", validate(createMovieSchema), adminCreateMovieController);
router.delete("/movies/:movieId", adminDeleteMovieController);


router.get("/showtimes", adminListShowtimesController);

/**
 * Creating and deleting showtimes (movie screenings).
 * POST creates a new showtime.
 * DELETE removes a showtime and related bookings.
 */
router.post("/showtimes", validate(createShowtimeSchema), adminCreateShowtimeController);
router.delete("/showtimes/:showtimeId", adminDeleteShowtimeController);

/**
 * Employee management.
 * GET lists employees with their assigned theaters.
 * POST creates a new employee user.
 * DELETE removes an employee and their theater assignments.
 */
router.get("/employees", adminListEmployeesController);
router.post("/employees", validate(createEmployeeSchema), adminCreateEmployeeController);
router.delete("/employees/:employeeId", adminDeleteEmployeeController);

/**
 * Booking history and filtering.
 * Supports optional query params (theaterId, dates).
 */
router.get("/bookings", adminListBookingsController);

export default router;