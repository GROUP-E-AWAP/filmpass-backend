import bcrypt from "bcryptjs";
import {
  adminCreateAuditorium,
  adminCreateMovie,
  adminCreateShowtime,
  adminCreateTheater,
  adminCreateUser,
  adminFindUserByEmail,
  adminGenerateSeatsForAuditorium,
  adminLinkEmployeeToTheater,
  adminListAuditoriums,
  adminListBookings,
  adminListEmployees,
  adminListMovies,
  adminListTheaters
} from "./admin.repository.js";

/**
 * Service: list all theaters for admin.
 * Thin wrapper over repository function (no extra logic yet).
 */
export async function adminListTheatersService() {
  return adminListTheaters();
}

/**
 * Service: create a new theater.
 * Payload is expected to be validated before this call.
 */
export async function adminCreateTheaterService(payload) {
  return adminCreateTheater(payload);
}

/**
 * Service: list all auditoriums for a given theater.
 */
export async function adminListAuditoriumsService(theaterId) {
  return adminListAuditoriums(theaterId);
}

/**
 * Service: create an auditorium and auto-generate its seats.
 * 1) Create auditorium record.
 * 2) Generate seats grid (rows x columns) based on created auditorium config.
 */
export async function adminCreateAuditoriumService(payload) {
  const auditorium = await adminCreateAuditorium(payload);

  await adminGenerateSeatsForAuditorium(
    auditorium.id,
    auditorium.seat_rows,
    auditorium.seat_cols
  );

  return auditorium;
}

/**
 * Service: list all movies.
 */
export async function adminListMoviesService() {
  return adminListMovies();
}

/**
 * Service: create a new movie entry.
 */
export async function adminCreateMovieService(payload) {
  return adminCreateMovie(payload);
}

/**
 * Service: create a new showtime (movie screening).
 */
export async function adminCreateShowtimeService(payload) {
  return adminCreateShowtime(payload);
}

/**
 * Service: create a new employee or admin user and link them to a theater.
 * Steps:
 *  1) Check if email is already used.
 *  2) Hash the password.
 *  3) Create the user record.
 *  4) Link user to the corresponding theater (if provided).
 */
export async function adminCreateEmployeeService(payload) {
  const { name, email, password, theaterId, role } = payload;

  // Prevent duplicate accounts by email
  const existing = await adminFindUserByEmail(email);
  if (existing) {
    const err = new Error("User with this email already exists");
    err.statusCode = 409; // HTTP 409 Conflict
    throw err;
  }

  // Hash password before storing in DB
  const hash = await bcrypt.hash(password, 10);

  // Create user in "user" table
  const user = await adminCreateUser({
    name,
    email,
    passwordHash: hash,
    role
  });

  // Assign user to a specific theater (many-to-many link table)
  await adminLinkEmployeeToTheater(user.user_id, theaterId);

  return user;
}

/**
 * Service: list employees and their theater assignments.
 */
export async function adminListEmployeesService() {
  return adminListEmployees();
}

/**
 * Service: list bookings using optional filters
 * (theaterId, fromDate, toDate).
 */
export async function adminListBookingsService(filters) {
  return adminListBookings(filters);
}
