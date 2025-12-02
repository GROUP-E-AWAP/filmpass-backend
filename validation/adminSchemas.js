import Joi from "joi";

/**
 * Validation schema for creating a theater.
 * Requires a name and location with reasonable length limits.
 */
export const createTheaterSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  location: Joi.string().min(2).max(255).required()
});

/**
 * Validation schema for creating an auditorium inside a theater.
 * seatRows and seatCols define auditorium seat grid dimensions.
 */
export const createAuditoriumSchema = Joi.object({
  theaterId: Joi.number().integer().required(),
  name: Joi.string().min(1).max(100).required(),
  seatRows: Joi.number().integer().min(1).max(30).required(),
  seatCols: Joi.number().integer().min(1).max(40).required()
});

/**
 * Validation schema for movie creation.
 * All core movie metadata validated here.
 */
export const createMovieSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  genre: Joi.string().max(100).allow("", null),
  durationMinutes: Joi.number().integer().min(1).max(600).required(),
  releaseDate: Joi.string().isoDate().allow(null, ""),
  description: Joi.string().allow("", null),
  posterUrl: Joi.string().uri().allow("", null)
});

/**
 * Validation schema for creating a showtime.
 * showDate must follow ISO YYYY-MM-DD format.
 */
export const createShowtimeSchema = Joi.object({
  movieId: Joi.number().integer().required(),
  theaterId: Joi.number().integer().required(),
  auditoriumId: Joi.number().integer().required(),
  showDate: Joi.string().isoDate().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  price: Joi.number().min(0).required()
});

/**
 * Validation schema for creating employees (admin panel).
 * Role allowed: "employee" or "admin".
 */
export const createEmployeeSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  theaterId: Joi.number().integer().required(),
  role: Joi.string().valid("employee", "admin").default("employee")
});

/**
 * Validation schema for admin booking filters.
 * All fields optional; validated only if provided.
 */
export const listBookingsSchema = Joi.object({
  theaterId: Joi.number().integer().optional(),
  fromDate: Joi.string().isoDate().optional(),
  toDate: Joi.string().isoDate().optional()
});
