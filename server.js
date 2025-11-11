import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

const db = getDb();

function uid(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

app.get("/health", (req, res) => res.json({ ok: true }));

// Movies list
app.get("/movies", (req, res) => {
  db.all(
    "SELECT id, title, description, duration_minutes, poster_url FROM movies ORDER BY title",
    (err, rows) => {
      if (err) return res.status(500).json({ error: String(err) });
      res.json(rows);
    }
  );
});

// Movie details with showtimes
app.get("/movies/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM movies WHERE id = ?", [id], (err, movie) => {
    if (err) return res.status(500).json({ error: String(err) });
    if (!movie) return res.status(404).json({ error: "Not found" });
    db.all(
      "SELECT * FROM showtimes WHERE movie_id = ? ORDER BY start_time",
      [id],
      (e2, shows) => {
        if (e2) return res.status(500).json({ error: String(e2) });
        res.json({ movie, showtimes: shows });
      }
    );
  });
});

// Seats availability for a showtime
app.get("/showtimes/:id/seats", (req, res) => {
  const showId = req.params.id;
  const sql = `
    SELECT s.id, s.row_label, s.seat_number,
           CASE WHEN EXISTS (
             SELECT 1 FROM booking_seats bs
             JOIN bookings b ON b.id = bs.booking_id
             WHERE bs.seat_id = s.id AND b.showtime_id = ? AND b.status = 'CONFIRMED'
           ) THEN 'BOOKED' ELSE 'AVAILABLE' END AS status
    FROM seats s
    WHERE s.auditorium_id = (SELECT auditorium_id FROM showtimes WHERE id = ?)
    ORDER BY s.row_label, s.seat_number
  `;
  db.all(sql, [showId, showId], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

// Create booking (simple, atomically via transaction)
app.post("/bookings", (req, res) => {
  const { showtimeId, customerEmail, seats, ticketType } = req.body;
  if (!showtimeId || !customerEmail || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  db.serialize(() => {
    db.run("BEGIN");
    db.get("SELECT price_adult, price_child FROM showtimes WHERE id = ?", [showtimeId], (e0, p) => {
      if (e0 || !p) {
        db.run("ROLLBACK");
        return res.status(400).json({ error: "Invalid showtime" });
      }
      const price = ticketType === "child" ? p.price_child : p.price_adult;
      const bookingId = uid("bk");
      const createdAt = new Date().toISOString();
      const total = price * seats.length;

      // Check availability
      const placeholders = seats.map(() => "?").join(",");
      const checkSql = `
        SELECT s.id
        FROM seats s
        WHERE s.id IN (${placeholders})
        AND EXISTS (
          SELECT 1 FROM booking_seats bs
          JOIN bookings b ON b.id = bs.booking_id
          WHERE bs.seat_id = s.id AND b.showtime_id = ? AND b.status = 'CONFIRMED'
        )
      `;
      db.all(checkSql, [...seats, showtimeId], (e1, conflicts) => {
        if (e1) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: String(e1) });
        }
        if (conflicts.length > 0) {
          db.run("ROLLBACK");
          return res.status(409).json({ error: "Seat already booked", conflicts });
        }
        // Insert booking
        db.run(
          "INSERT INTO bookings (id, showtime_id, customer_email, total_amount, status, created_at) VALUES (?, ?, ?, ?, 'CONFIRMED', ?)",
          [bookingId, showtimeId, customerEmail, total, createdAt],
          e2 => {
            if (e2) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: String(e2) });
            }
            // Insert seats
            const stmt = db.prepare("INSERT INTO booking_seats (id, booking_id, seat_id, price) VALUES (?, ?, ?, ?)");
            for (const seatId of seats) {
              stmt.run(uid("bks"), bookingId, seatId, price);
            }
            stmt.finalize(errF => {
              if (errF) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: String(errF) });
              }
              db.run("COMMIT");
              return res.status(201).json({ bookingId, total });
            });
          }
        );
      });
    });
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
