import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

// для контроля, без пароля
console.log("DB config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  ssl: process.env.DB_SSL
});


const app = express();
app.use(cors());
app.use(express.json());

/* Health */
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/db-health", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

/* Movies list */
app.get("/movies", async (_req, res) => {
  try {
    const q = `
      SELECT movie_id AS id, title, description, duration_minutes, release_date
      FROM movie
      ORDER BY title
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* Movie details + soonest showtimes (join theater) */
app.get("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const m = await pool.query(`
      SELECT movie_id AS id, title, description, duration_minutes, release_date, genre
      FROM movie WHERE movie_id = $1
    `, [id]);
    if (m.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const s = await pool.query(`
      SELECT s.showtime_id AS id,
             s.show_date,
             s.start_time,
             s.end_time,
             s.price,
             t.theater_id,
             t.name AS theater_name,
             t.location AS theater_location
      FROM showtime s
      JOIN theater t ON t.theater_id = s.theater_id
      WHERE s.movie_id = $1
      ORDER BY s.show_date, s.start_time
    `, [id]);

    res.json({ movie: m.rows[0], showtimes: s.rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* Create booking */
app.post("/bookings", async (req, res) => {
  const { userEmail, userName, showtimeId, seats } = req.body;
  if (!userEmail || !showtimeId || !seats || seats <= 0) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) find or create user
    // password  NOT NULL, so we add 'guest'
    const uSel = await client.query(`SELECT user_id FROM public."user" WHERE email = $1 LIMIT 1`, [userEmail]);
    let userId;
    if (uSel.rows.length) {
      userId = uSel.rows[0].user_id;
    } else {
      const ins = await client.query(
        `INSERT INTO public."user"(name, email, password, role) VALUES ($1, $2, 'guest', 'customer') RETURNING user_id`,
        [userName || userEmail.split("@")[0], userEmail]
      );
      userId = ins.rows[0].user_id;
    }

    // 2) price
    const pr = await client.query(`SELECT price FROM showtime WHERE showtime_id = $1`, [showtimeId]);
    if (pr.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid showtime" });
    }
    const price = Number(pr.rows[0].price || 0);
    const total = price * Number(seats);

    // 3) create booking
    const b = await client.query(
      `INSERT INTO booking (user_id, showtime_id, seats, total_amount, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING booking_id`,
      [userId, showtimeId, seats, total]
    );

    await client.query("COMMIT");
    res.status(201).json({ bookingId: b.rows[0].booking_id, total });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: String(e) });
  } finally {
    client.release();
  }
});

/* Endpoint for later */
app.get("/showtimes/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const r = await pool.query(`
      SELECT showtime_id AS id, movie_id, theater_id, show_date, start_time, end_time, price
      FROM showtime WHERE movie_id = $1
      ORDER BY show_date, start_time
    `, [id]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
