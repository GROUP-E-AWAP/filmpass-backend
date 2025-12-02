import { query } from "../../config/db.js";

/**
 * Return a list of all theaters with basic info.
 * Ordered alphabetically by name.
 */
export async function listTheaters() {
  const result = await query(
    `SELECT theater_id AS id,
            name,
            location
       FROM theater
      ORDER BY name`
  );
  return result.rows;
}

/**
 * Return all movies that have at least one showtime
 * scheduled in the given theater.
 *
 * DISTINCT ensures no duplicate movies if multiple showtimes exist.
 */
export async function listMoviesByTheater(theaterId) {
  const result = await query(
    `SELECT DISTINCT
            m.movie_id AS id,
            m.title,
            m.description,
            m.duration_minutes,
            m.poster_url
       FROM movie m
       JOIN showtime s ON s.movie_id = m.movie_id
      WHERE s.theater_id = $1
      ORDER BY m.title`,
    [theaterId]
  );

  return result.rows;
}
