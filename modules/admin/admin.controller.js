import {
  adminCreateAuditoriumService,
  adminCreateEmployeeService,
  adminCreateMovieService,
  adminCreateShowtimeService,
  adminCreateTheaterService,
  adminListAuditoriumsService,
  adminListBookingsService,
  adminListEmployeesService,
  adminListMoviesService,
  adminListTheatersService
} from "./admin.service.js";

/**
 * GET /admin/theaters
 * Returns a list of all theaters for admin dashboard.
 */
export async function adminListTheatersController(_req, res, next) {
  try {
    const theaters = await adminListTheatersService();
    res.json(theaters);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /admin/theaters
 * Creates a new theater using data from the request body.
 */
export async function adminCreateTheaterController(req, res, next) {
  try {
    const theater = await adminCreateTheaterService(req.body);
    res.status(201).json(theater);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /admin/theaters/:theaterId/auditoriums
 * Returns all auditoriums that belong to a specific theater.
 */
export async function adminListAuditoriumsController(req, res, next) {
  try {
    const theaterId = Number(req.params.theaterId);

    // Basic validation for path parameter
    if (Number.isNaN(theaterId)) {
      return res.status(400).json({ error: "Invalid theater id" });
    }

    const data = await adminListAuditoriumsService(theaterId);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /admin/auditoriums
 * Creates a new auditorium (screening room) in a theater.
 */
export async function adminCreateAuditoriumController(req, res, next) {
  try {
    const auditorium = await adminCreateAuditoriumService(req.body);
    res.status(201).json(auditorium);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /admin/movies
 * Returns a list of all movies available in the system.
 */
export async function adminListMoviesController(_req, res, next) {
  try {
    const movies = await adminListMoviesService();
    res.json(movies);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /admin/movies
 * Creates a new movie entry with metadata (title, description, etc.).
 */
export async function adminCreateMovieController(req, res, next) {
  try {
    const movie = await adminCreateMovieService(req.body);
    res.status(201).json(movie);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /admin/showtimes
 * Creates a showtime (movie + auditorium + time + price).
 */
export async function adminCreateShowtimeController(req, res, next) {
  try {
    const showtime = await adminCreateShowtimeService(req.body);
    res.status(201).json(showtime);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /admin/employees
 * Creates a new employee/user (e.g. manager, cashier, admin).
 */
export async function adminCreateEmployeeController(req, res, next) {
  try {
    const user = await adminCreateEmployeeService(req.body);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /admin/employees
 * Returns a list of all employees managed by admin.
 */
export async function adminListEmployeesController(_req, res, next) {
  try {
    const employees = await adminListEmployeesService();
    res.json(employees);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /admin/bookings
 * Returns bookings filtered by optional query parameters:
 *  - theaterId: only bookings for this theater
 *  - fromDate / toDate: date range for booking showtimes
 */
export async function adminListBookingsController(req, res, next) {
  try {
    const { theaterId, fromDate, toDate } = req.query;

    // Normalize and typecast filters for the service layer
    const filters = {
      theaterId: theaterId ? Number(theaterId) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined
    };

    const bookings = await adminListBookingsService(filters);
    res.json(bookings);
  } catch (e) {
    next(e);
  }
}
