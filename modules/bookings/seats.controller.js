import { getAuditoriumForShowtime, listSeatsWithStatus } from "./seats.repository.js";

/**
 * Return all seats for a specific showtime, including booking status.
 * Steps:
 *   1) Validate showtimeId from URL.
 *   2) Resolve auditorium assigned to the showtime.
 *   3) Fetch seat map + availability info.
 */
export async function listSeatsForShowtimeController(req, res, next) {
  try {
    const showtimeId = Number(req.params.id);

    // Basic check to avoid passing garbage into the DB layer
    if (Number.isNaN(showtimeId)) {
      return res.status(400).json({ error: "Invalid showtime id" });
    }

    // Determine which auditorium this showtime uses
    const aud = await getAuditoriumForShowtime(showtimeId);
    if (!aud || !aud.auditorium_id) {
      return res.status(400).json({ error: "Showtime has no auditorium" });
    }

    // Fetch seats + booked/unbooked state
    const seats = await listSeatsWithStatus(showtimeId, aud.auditorium_id);

    res.json(seats);
  } catch (e) {
    next(e);
  }
}
