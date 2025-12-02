import { listMoviesByTheater, listTheaters } from "./theaters.repository.js";

/**
 * Service: return all theaters.
 * Thin wrapper around repository.
 */
export async function listTheatersService() {
  return listTheaters();
}

/**
 * Service: return all movies that have showtimes in the given theater.
 */
export async function listMoviesByTheaterService(theaterId) {
  const movies = await listMoviesByTheater(theaterId);
  return movies;
}
