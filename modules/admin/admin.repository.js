import { query } from "../../config/db.js";

/**
 * Fetch all theaters with basic metadata.
 */
export async function adminListTheaters() {
  const result = await query(
    `SELECT theater_id AS id, name, location
       FROM theater
      ORDER BY name`
  );
  return result.rows;
}

/**
 * Insert a new theater into the system.
 */
export async function adminCreateTheater({ name, location }) {
  const result = await query(
    `INSERT INTO theater (name, location)
     VALUES ($1, $2)
     RETURNING theater_id AS id, name, location`,
    [name, location]
  );
  return result.rows[0];
}

/**
 * Returns all auditoriums belonging to a given theater.
 */
export async function adminListAuditoriums(theaterId) {
  const result = await query(
    `SELECT auditorium_id AS id,
            theater_id,
            name,
            seat_rows,
            seat_cols
       FROM auditorium
      WHERE theater_id = $1
      ORDER BY name`,
    [theaterId]
  );
  return result.rows;
}

/**
 * Creates an auditorium and stores its seating configuration.
 */
export async function adminCreateAuditorium({ theaterId, name, seatRows, seatCols }) {
  const result = await query(
    `INSERT INTO auditorium (theater_id, name, seat_rows, seat_cols)
     VALUES ($1, $2, $3, $4)
     RETURNING auditorium_id AS id, theater_id, name, seat_rows, seat_cols`,
    [theaterId, name, seatRows, seatCols]
  );
  return result.rows[0];
}

/**
 * Regenerates seats for a given auditorium.
 * Deletes old seats → creates a full grid using generate_series().
 * row_label uses ASCII codes: A, B, C...
 */
export async function adminGenerateSeatsForAuditorium(auditoriumId, seatRows, seatCols) {
  // Remove old seats to avoid duplicates
  await query(
    `DELETE FROM seat WHERE auditorium_id = $1`,
    [auditoriumId]
  );

  // Insert new seat grid using PostgreSQL's generate_series()
  await query(
    `
    WITH rows AS (
      SELECT generate_series(1, $1) AS r
    ),
    nums AS (
      SELECT generate_series(1, $2) AS n
    )
    INSERT INTO seat (auditorium_id, row_label, seat_number)
    SELECT $3::int AS auditorium_id,
           chr(64 + r) AS row_label,   -- Convert row number to letter
           n AS seat_number
    FROM rows CROSS JOIN nums
    `,
    [seatRows, seatCols, auditoriumId]
  );
}

/**
 * Return all movies with full metadata.
 */
export async function adminListMovies() {
  const result = await query(
    `SELECT movie_id AS id,
            title,
            genre,
            duration_minutes,
            release_date,
            description,
            poster_url
       FROM movie
      ORDER BY title`
  );
  return result.rows;
}

/**
 * Insert a new movie.
 * Some fields allow null for optional data.
 */
export async function adminCreateMovie({
  title,
  genre,
  durationMinutes,
  releaseDate,
  description,
  posterUrl
}) {
  const result = await query(
    `INSERT INTO movie (title, genre, duration_minutes, release_date, description, poster_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING movie_id AS id,
               title,
               genre,
               duration_minutes,
               release_date,
               description,
               poster_url`,
    [title, genre || null, durationMinutes, releaseDate || null, description || null, posterUrl || null]
  );
  return result.rows[0];
}

/**
 * Create a showtime (movie screening event).
 * start_time and end_time are constructed by merging date + time.
 */
export async function adminCreateShowtime({
  movieId,
  theaterId,
  auditoriumId,
  showDate,
  startTime,
  endTime,
  price
}) {
  const result = await query(
    `INSERT INTO showtime (movie_id, theater_id, auditorium_id, show_date, start_time, end_time, price)
     VALUES (
       $1,
       $2,
       $3,
       $4::date,
       ($4::date + $5::time)::timestamp,
       ($4::date + $6::time)::timestamp,
       $7
     )
     RETURNING showtime_id AS id,
               movie_id,
               theater_id,
               auditorium_id,
               show_date,
               start_time,
               end_time,
               price`,
    [movieId, theaterId, auditoriumId, showDate, startTime, endTime, price]
  );
  return result.rows[0];
}

/**
 * Find a system user by email.
 * Used mainly for creating employees and preventing duplicates.
 */
export async function adminFindUserByEmail(email) {
  const result = await query(
    `SELECT user_id, name, email, role
       FROM public."user"
      WHERE email = $1
      LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user (admin or employee).
 * Password is expected to already be hashed.
 */
export async function adminCreateUser({ name, email, passwordHash, role }) {
  const result = await query(
    `INSERT INTO public."user"(name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}

/**
 * Link employee to a specific theater.
 * ON CONFLICT prevents duplicate links.
 */
export async function adminLinkEmployeeToTheater(userId, theaterId) {
  const result = await query(
    `INSERT INTO employee_theater (user_id, theater_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, theater_id) DO NOTHING
     RETURNING id, user_id, theater_id`,
    [userId, theaterId]
  );
  return result.rows[0] || null;
}

/**
 * Returns list of employees with their assigned theaters.
 * Includes both employees and admins.
 */
export async function adminListEmployees() {
  const result = await query(
    `SELECT u.user_id AS id,
            u.name,
            u.email,
            u.role,
            et.theater_id,
            t.name AS theater_name
       FROM public."user" u
  LEFT JOIN employee_theater et ON et.user_id = u.user_id
  LEFT JOIN theater t           ON t.theater_id = et.theater_id
      WHERE u.role IN ('employee', 'admin')
      ORDER BY u.user_id`
  );
  return result.rows;
}

/**
 * Return bookings filtered by optional criteria.
 * Dynamic WHERE clause is constructed based on provided filters.
 */
export async function adminListBookings({ theaterId, fromDate, toDate }) {
  const params = [];
  const conditions = [];

  // Build dynamic query filters
  if (theaterId) {
    params.push(theaterId);
    conditions.push(`s.theater_id = $${params.length}`);
  }

  if (fromDate) {
    params.push(fromDate);
    conditions.push(`b.created_at::date >= $${params.length}`);
  }

  if (toDate) {
    params.push(toDate);
    conditions.push(`b.created_at::date <= $${params.length}`);
  }

  // Construct WHERE if any filters exist
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await query(
    `
    SELECT
      b.booking_id        AS id,
      b.created_at,
      b.status,
      b.total_amount,
      u.email             AS customer_email,
      m.title             AS movie_title,
      t.name              AS theater_name,
      a.name              AS auditorium_name,
      s.show_date,
      s.start_time
    FROM booking b
    JOIN public."user" u ON u.user_id = b.user_id
    JOIN showtime s      ON s.showtime_id = b.showtime_id
    JOIN movie m         ON m.movie_id = s.movie_id
    JOIN theater t       ON t.theater_id = s.theater_id
    LEFT JOIN auditorium a ON a.auditorium_id = s.auditorium_id
    ${whereClause}
    ORDER BY b.created_at DESC
    `,
    params
  );

  return result.rows;
}

/**
 * Delete a movie by its ID.
 */
export async function adminDeleteMovie(movieId) {
  const result = await query(
    `DELETE FROM movie
     WHERE movie_id = $1
     RETURNING movie_id`,
    [movieId]
  );
  return result.rows[0];
}
