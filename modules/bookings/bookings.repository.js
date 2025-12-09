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

  console.log(`💾 Creating booking ${bookingId} with ${seats.length} seats:`, seats);

  // Insert a row for each reserved seat
  for (const seatId of seats) {
    await client.query(
      `INSERT INTO booking_seat (booking_id, seat_id, ticket_type, price)
       VALUES ($1, $2, $3, $4)`,
      [bookingId, seatId, ticketType, price]
    );
    console.log(`  ✓ Saved seat ${seatId} for booking ${bookingId}`);
  }

  return bookingId;
}

/**
 * Get complete booking details for email receipt
 * Joins all necessary tables to get movie, showtime, theater, seat information
 */
export async function getBookingDetailsForEmail(bookingId) {
  try {
    // First get basic booking details
    const result = await query(
      `SELECT 
        b.booking_id,
        b.total_amount,
        b.seats as num_seats,
        b.created_at as booking_timestamp,
        b.status,
        u.name as customer_name,
        u.email as customer_email,
        m.title as movie_title,
        m.poster_url as movie_poster,
        s.start_time as showtime,
        t.name as theater_name,
        t.location as theater_location,
        a.name as auditorium_name
      FROM booking b
      JOIN public."user" u ON u.user_id = b.user_id
      JOIN showtime s ON s.showtime_id = b.showtime_id
      JOIN movie m ON m.movie_id = s.movie_id
      JOIN auditorium a ON a.auditorium_id = s.auditorium_id
      JOIN theater t ON t.theater_id = a.theater_id
      WHERE b.booking_id = $1`,
      [bookingId]
    );
    
    if (!result.rows[0]) {
      return null;
    }
    
    const bookingDetails = result.rows[0];
    
    // Try to get seat numbers from booking_seat table
    try {
      const seatResult = await query(
        `SELECT STRING_AGG(seat.row_label || seat.seat_number::text, ', ' ORDER BY seat.row_label, seat.seat_number) as seat_numbers
         FROM booking_seat bs
         JOIN seat ON seat.seat_id = bs.seat_id
         WHERE bs.booking_id = $1`,
        [bookingId]
      );
      
      if (seatResult.rows[0]?.seat_numbers) {
        bookingDetails.seat_numbers = seatResult.rows[0].seat_numbers;
      } else {
        bookingDetails.seat_numbers = null;
      }
    } catch (seatError) {
      console.warn(`⚠️ Could not fetch seat numbers for booking ${bookingId}:`, seatError.message);
      bookingDetails.seat_numbers = null;
    }
    
    console.log('📧 Booking details for email:', {
      bookingId: bookingDetails.booking_id,
      seatNumbers: bookingDetails.seat_numbers,
      numSeats: bookingDetails.num_seats
    });
    
    return bookingDetails;
  } catch (error) {
    console.error(`❌ Error fetching booking details for email (booking ${bookingId}):`, error.message);
    console.error('Full error:', error);
    return null;
  }
}

/**
 * Update booking email sent status
 */
export async function updateBookingEmailStatus(bookingId, success, messageId = null, error = null) {
  try {
    if (success) {
      await query(
        `UPDATE booking 
         SET email_sent = TRUE, 
             email_sent_at = CURRENT_TIMESTAMP,
             email_attempts = COALESCE(email_attempts, 0) + 1
         WHERE booking_id = $1`,
        [bookingId]
      );
    } else {
      await query(
        `UPDATE booking 
         SET email_attempts = COALESCE(email_attempts, 0) + 1,
             email_error = $2
         WHERE booking_id = $1`,
        [bookingId, error]
      );
    }
  } catch (err) {
    console.warn(`Warning: Could not update email status for booking ${bookingId}. Email tracking columns may not exist. Run migration: migrations/add_email_tracking.sql`);
    console.warn(`Error details:`, err.message);
  }
}

/**
 * Log email send attempt for debugging and audit
 */
export async function logEmailAttempt(bookingId, recipientEmail, status, messageId = null, errorMessage = null, attemptNumber = 1) {
  try {
    await query(
      `INSERT INTO email_log (booking_id, recipient_email, email_type, subject, status, message_id, error_message, attempt_number)
       VALUES ($1, $2, 'booking_confirmation', 'Booking Confirmation', $3, $4, $5, $6)`,
      [bookingId, recipientEmail, status, messageId, errorMessage, attemptNumber]
    );
  } catch (err) {
    console.warn(`Warning: Could not log email attempt. email_log table may not exist. Run migration: migrations/add_email_tracking.sql`);
    console.warn(`Error details:`, err.message);
  }
}

