import { pool, query } from "../../config/db.js";

/**
 * Get a dedicated database client (connection) for transactions.
 * Caller is responsible for client.release() or client.rollback().
 */
export function getClient() {
  return pool.connect();
}

/**
 * Fetch base ticket price for a given showtime.
 * Used when calculating total booking cost.
 */
export async function getShowtimePrice(showtimeId) {
  const result = await query(
    `SELECT price
       FROM showtime
      WHERE showtime_id = $1`,
    [showtimeId]
  );
  return result.rows[0] || null;
}

/**
 * Find an existing user by email during booking creation.
 * Booking flow treats missing users as guest customers.
 */
export async function findUserByEmailForBooking(email) {
  const result = await query(
    `SELECT user_id
       FROM public."user"
      WHERE email = $1
      LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Create a guest customer record.
 * Guests have NULL passwords and role 'customer'.
 */
export async function createGuestUser(name, email) {
  const result = await query(
    `INSERT INTO public."user"(name, email, password, role)
     VALUES ($1, $2, NULL, 'customer')
     RETURNING user_id`,
    [name, email]
  );
  return result.rows[0];
}

/**
 * Check whether any of the selected seats are already booked
 * for the same showtime. Uses a client-bound query to ensure
 * consistency inside a transaction.
 */
export async function checkSeatsAlreadyBooked(client, showtimeId, seatIds) {
  const result = await client.query(
    `SELECT 1
       FROM booking_seat bs
       JOIN booking b ON b.booking_id = bs.booking_id
      WHERE bs.seat_id = ANY($1::int[])
        AND b.showtime_id = $2
        AND b.status = 'confirmed'
      LIMIT 1`,
    [seatIds, showtimeId]
  );
  return result.rows.length > 0;
}

/**
 * Create a booking and attach all chosen seats.
 * Entire flow must run inside a transaction:
 *   - Insert booking
 *   - Insert booking_seat rows for each seat
 * Booking is confirmed immediately (no pending status).
 */
export async function createBookingWithSeats(
  client,
  { userId, showtimeId, seats, ticketType, price, total }
) {
  const bookingResult = await client.query(
    `INSERT INTO booking (user_id, showtime_id, seats, total_amount, status)
     VALUES ($1, $2, $3, $4, 'confirmed')
     RETURNING booking_id`,
    [userId, showtimeId, seats.length, total]
  );

  const bookingId = bookingResult.rows[0].booking_id;

  // Insert a row for each reserved seat
  for (const seatId of seats) {
    await client.query(
      `INSERT INTO booking_seat (booking_id, seat_id, ticket_type, price)
       VALUES ($1, $2, $3, $4)`,
      [bookingId, seatId, ticketType, price]
    );
  }

  return bookingId;
}
