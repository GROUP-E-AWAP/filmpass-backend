import {
  getMovieById,
  listMovies,
  listShowtimesForMovie
} from "./movies.repository.js";

/**
 * Service: return full list of movies.
 * Simple passthrough to the repository.
 */
export async function listMoviesService() {
  return listMovies();
}

/**
 * Service: return detailed information about a movie + its showtimes.
 * Throws a 404 error if the movie does not exist.
 *
 * theaterId (optional) filters showtimes to a specific theater.
 */
export async function movieDetailsService(movieId, theaterId = null) {
  const movie = await getMovieById(movieId);

  if (!movie) {
    const err = new Error("Movie not found");
    err.statusCode = 404;
    throw err;
  }

  const showtimes = await listShowtimesForMovie(movieId, theaterId);

  return { movie, showtimes };
}
