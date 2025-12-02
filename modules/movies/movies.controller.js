import { listMoviesService, movieDetailsService } from "./movies.service.js";

/**
 * GET /movies
 * Returns a full list of movies available for customers.
 * No filters; pure listing.
 */
export async function listMoviesController(_req, res, next) {
  try {
    const movies = await listMoviesService();
    res.json(movies);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /movies/:id
 * Returns detailed info for a specific movie.
 * Optional query param: theaterId → filters showtimes by theater.
 */
export async function movieDetailsController(req, res, next) {
  try {
    const id = Number(req.params.id);

    // Validate movie id
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid movie id" });
    }

    // Optional theater filter
    const theaterIdRaw = req.query.theaterId;
    const theaterId = theaterIdRaw ? Number(theaterIdRaw) : null;

    if (theaterIdRaw && Number.isNaN(theaterId)) {
      return res.status(400).json({ error: "Invalid theater id" });
    }

    const data = await movieDetailsService(id, theaterId);

    res.json(data);
  } catch (e) {
    next(e);
  }
}
