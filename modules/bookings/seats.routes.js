import { Router } from "express";
import { listSeatsForShowtimeController } from "./seats.controller.js";

const router = Router();

/**
 * GET /showtimes/:id/seats
 * Returns the seating map for the given showtime,
 * including booking status for each seat.
 */
router.get("/:id/seats", listSeatsForShowtimeController);

export default router;
