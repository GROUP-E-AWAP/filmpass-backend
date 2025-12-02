import { query } from "../../config/db.js";

/**
 * Get the auditorium assigned to a specific showtime.
 * Used to know which seat map should be displayed.
 */
export async function getAuditoriumForShowtime(showtimeId) {
  const result = await query(
    `SELECT auditorium_id
       FROM showtime
      WHERE showtime_id = $1`,
    [showtimeId]
  );
  return result.rows[0] || null;
}

/**
 * Return all seats in the auditorium, enriched with booking status.
 * Status logic:
 *   - BOOKED: seat appears in booking_seat for this showtime AND booking.status = 'confirmed'
 *   - AVAILABLE: otherwise
 *
 * Seats are returned sorted by row (A, B, C...) and seat number.
 */
export async function listSeatsWithStatus(showtimeId, auditoriumId) {
  const result = await query(
    `SELECT s.seat_id AS id,
            s.row_label,
            s.seat_number,
            CASE
              WHEN EXISTS (
                SELECT 1
                  FROM booking_seat bs
                  JOIN booking b ON b.booking_id = bs.booking_id
                 WHERE bs.seat_id = s.seat_id
                   AND b.showtime_id = $1
                   AND b.status = 'confirmed'
              )
              THEN 'BOOKED'
              ELSE 'AVAILABLE'
            END AS status
       FROM seat s
      WHERE s.auditorium_id = $2
      ORDER BY s.row_label, s.seat_number`,
    [showtimeId, auditoriumId]
  );

  return result.rows;
}
