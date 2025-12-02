import jwt from "jsonwebtoken";
import {
  checkSeatsAlreadyBooked,
  createBookingWithSeats,
  createGuestUser,
  findUserByEmailForBooking,
  getClient,
  getShowtimePrice
} from "./bookings.repository.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Core booking flow.
 * Handles both authenticated users (Bearer token)
 * and guest users (email + optional name).
 * Runs inside a SQL transaction to avoid race conditions with seat booking.
 */
export async function createBookingService(payload, authHeader) {
  const { showtimeId, seats, userEmail, userName, ticketType } = payload;

  // Dedicated client for transaction control
  const client = await getClient();
  try {
    await client.query("BEGIN");

    let userId = null;
    let emailToUse = userEmail || null;

    /**
     * Try reading user info from JWT (if provided).
     * If token invalid или устаревший — просто игнорируем
     * и работаем как с гостем, чтобы не ломать UX.
     */
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        emailToUse = decoded.email;
      } catch (e) {
        // Token invalid? Good job whoever generated that mess.
        // Fall back to guest flow silently.
      }
    }

    /**
     * If user is NOT authenticated, we need to resolve them:
     *   - Find existing customer by email
     *   - Or create a lightweight guest user
     */
    if (!userId) {
      if (!emailToUse) {
        const err = new Error("Email required for guest booking");
        err.statusCode = 400;
        throw err;
      }

      const existing = await findUserByEmailForBooking(emailToUse);
      if (existing) {
        userId = existing.user_id;
      } else {
        const displayName =
          (userName && userName.trim()) || emailToUse.split("@")[0];
        const created = await createGuestUser(displayName, emailToUse);
        userId = created.user_id;
      }
    }

    /**
     * Validate showtime and compute pricing.
     */
    const showtime = await getShowtimePrice(showtimeId);
    if (!showtime) {
      const err = new Error("Invalid showtime");
      err.statusCode = 400;
      throw err;
    }

    const basePrice = Number(showtime.price || 0);
    const perTicketPrice =
      ticketType === "child" ? basePrice * 0.7 : basePrice;
    const total = perTicketPrice * seats.length;

    /**
     * Check if seats are still available.
     * This must be inside transaction to prevent double-booking.
     */
    const seatsAlreadyBooked = await checkSeatsAlreadyBooked(
      client,
      showtimeId,
      seats
    );

    if (seatsAlreadyBooked) {
      const err = new Error("One or more seats already booked");
      err.statusCode = 409;
      throw err;
    }

    /**
     * Create booking + individual seat records.
     */
    const bookingId = await createBookingWithSeats(client, {
      userId,
      showtimeId,
      seats,
      ticketType,
      price: perTicketPrice,
      total
    });

    await client.query("COMMIT");

    return { bookingId, total };
  } catch (e) {
    // Anything goes wrong → revert all changes
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release(); // Always release the connection back to the pool
  }
}
