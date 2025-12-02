import {
  listMoviesByTheaterService,
  listTheatersService
} from "./theaters.service.js";

/**
 * GET /theaters
 * Returns a list of all theaters.
 */
export async function listTheatersController(_req, res, next) {
  try {
    const theaters = await listTheatersService();
    res.json(theaters);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /theaters/:id/movies
 * Returns all movies that have showtimes in a specific theater.
 */
export async function listMoviesByTheaterController(req, res, next) {
  try {
    const theaterId = Number(req.params.id);

    // Validate ID before querying DB
    if (Number.isNaN(theaterId)) {
      return res.status(400).json({ error: "Invalid theater id" });
    }

    const movies = await listMoviesByTheaterService(theaterId);

    res.json(movies);
  } catch (e) {
    next(e);
  }
}
