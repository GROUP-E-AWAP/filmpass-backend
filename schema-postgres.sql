-- PostgreSQL Schema for Movie Theater Booking System

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS booking_seats CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS showtimes CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS auditoriums CASCADE;
DROP TABLE IF EXISTS movies CASCADE;

-- Movies table
CREATE TABLE movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  poster_url TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 12.00
);

-- Auditoriums table
CREATE TABLE auditoriums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  seat_rows INTEGER NOT NULL,
  seat_cols INTEGER NOT NULL
);

-- Seats table
CREATE TABLE seats (
  id TEXT PRIMARY KEY,
  auditorium_id TEXT NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  UNIQUE (auditorium_id, row_label, seat_number)
);

-- Showtimes table
CREATE TABLE showtimes (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  auditorium_id TEXT NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  price_adult DECIMAL(10,2) NOT NULL,
  price_child DECIMAL(10,2) NOT NULL
);

-- Bookings table
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  showtime_id TEXT NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED','CANCELLED')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Booking seats junction table
CREATE TABLE booking_seats (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  price DECIMAL(10,2) NOT NULL,
  UNIQUE (booking_id, seat_id)
);

-- Indexes
CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_booking_seats_seat ON booking_seats(seat_id);