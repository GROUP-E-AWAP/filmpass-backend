PRAGMA foreign_keys = ON;

CREATE TABLE movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  poster_url TEXT
);

CREATE TABLE auditoriums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  seat_rows INTEGER NOT NULL,
  seat_cols INTEGER NOT NULL
);

CREATE TABLE seats (
  id TEXT PRIMARY KEY,
  auditorium_id TEXT NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  UNIQUE (auditorium_id, row_label, seat_number)
);

CREATE TABLE showtimes (
  id TEXT PRIMARY KEY,
  movie_id TEXT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  auditorium_id TEXT NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  price_adult REAL NOT NULL,
  price_child REAL NOT NULL
);

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  showtime_id TEXT NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED','CANCELLED')),
  created_at TEXT NOT NULL
);

CREATE TABLE booking_seats (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id TEXT NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  price REAL NOT NULL,
  UNIQUE (booking_id, seat_id)
);

CREATE INDEX idx_showtimes_movie ON showtimes(movie_id);
CREATE INDEX idx_booking_seats_seat ON booking_seats(seat_id);
