import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { createBookingSchema } from "../../validation/bookingSchemas.js";
import { createBookingController } from "./bookings.controller.js";

const router = Router();

/**
 * POST /bookings
 * Creates a new booking.
 * Request body is validated using createBookingSchema.
 */
router.post("/", validate(createBookingSchema), createBookingController);

export default router;
