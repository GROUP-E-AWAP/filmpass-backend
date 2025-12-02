import Joi from "joi";

/**
 * Validation schema for creating a booking.
 *
 * Fields:
 *  - showtimeId: required showtime identifier
 *  - seats: array of seat IDs to reserve (must contain at least 1 seat)
 *  - userEmail: optional, used for guest bookings
 *  - userName: optional display name for guest users
 *  - ticketType: "adult" (default) or "child"
 */
export const createBookingSchema = Joi.object({
  showtimeId: Joi.number().integer().required(),
  seats: Joi.array().items(Joi.number().integer()).min(1).required(),
  userEmail: Joi.string().email().optional(),
  userName: Joi.string().max(100).optional(),
  ticketType: Joi.string().valid("adult", "child").default("adult")
});
