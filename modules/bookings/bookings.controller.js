import { createBookingService } from "./bookings.service.js";

/**
 * Create a new booking for a showtime.
 * Expects full booking payload in req.body.
 * Passes along the Authorization header so the service
 * can handle customer authentication inside booking flow.
 */
export async function createBookingController(req, res, next) {
  try {
    // Authorization header may contain Bearer token; pass it through
    const result = await createBookingService(
      req.body,
      req.headers.authorization || ""
    );

    res.status(201).json(result);
  } catch (e) {
    next(e); // Delegate to global error handler
  }
}
