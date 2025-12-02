import { JWT_SECRET } from "./config/env.js";
import { createApp } from "./app.js";
import { pool } from "./config/db.js";
import express from "express";
import cors from "cors";
import Stripe from "stripe";

// Initialize Stripe with proper error handling
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY not found in environment variables");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = createApp();

/**
 * Start HTTP server and perform basic startup diagnostics:
 *  - Print DB config (safe subset)
 *  - Confirm JWT secret presence
 *  - Run a simple DB health check query
 */

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

app.get("/", (req, res) => {
  res.send("Welcome to the Movie Theater Booking API" );
});

/* Movies list */
app.get("/movies", async (_req, res) => {
  try {
    const q = `
      SELECT movie_id as id, title, description, duration_minutes, poster_url
      FROM movie
      ORDER BY title
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* Movie details + soonest showtimes (join auditorium) */
app.get("/movies/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const m = await pool.query(`
      SELECT movie_id as id, title, description, duration_minutes, poster_url
      FROM movie WHERE movie_id = $1
    `, [id]);
    if (m.rows.length === 0) return res.status(404).json({ error: "Not found" });

    const s = await pool.query(`
      SELECT s.showtime_id as id,
             s.start_time,
             s.end_time,
             s.price as price_adult,
             s.price as price_child,
             s.price,
             a.auditorium_id,
             a.name AS theater_name
      FROM showtime s
      JOIN auditorium a ON a.auditorium_id = s.auditorium_id
      WHERE s.movie_id = $1
      ORDER BY s.start_time
    `, [id]);

    res.json({ movie: m.rows[0], showtimes: s.rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Create a new movie
app.post('/movies', async (req, res) => {
  try {
    const { id, title, description, duration_minutes, poster_url, genre } = req.body;

    // Basic validation
    if (!title || !duration_minutes) {
      return res.status(400).json({ error: "Title and duration_minutes are required" });
    }

    const result = await pool.query(
      `INSERT INTO movie (title, description, duration_minutes, poster_url, genre) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING movie_id as id, title, description, duration_minutes, poster_url, genre`,
      [title, description, duration_minutes, poster_url, genre || 'Drama']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating movie:", err);
    res.status(500).json({ error: "Internal Server Error"});
  }
});

// Delete a movie (also used by the Admin page)
app.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM movie WHERE movie_id = $1', [id]);
    res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Error deleting movie:", err);
    res.status(500).json({ error: "Internal Server Error"});
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

    // 2) price (using price from showtime)
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
  const id = req.params.id;
  try {
    const r = await pool.query(`
      SELECT showtime_id as id, movie_id, auditorium_id, start_time, end_time, price, price AS price_adult, price AS price_child
      FROM showtime WHERE movie_id = $1
      ORDER BY start_time
    `, [id]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

/* Stripe Payment Integration */

// Create payment intent
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", bookingDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: bookingDetails || {},
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Alternative endpoint paths that frontend might be using
app.post("/api/create-payment-intent", async (req, res) => {
  req.url = "/create-payment-intent";
  app._router.handle(req, res);
});

app.post("/payment/create-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", bookingDetails } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: bookingDetails || {},
    });
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session (for Stripe Checkout flow)
// This endpoint returns a Payment Intent for embedded checkout UI
app.post("/create-checkout-session", async (req, res) => {
  try {
    console.log("Received checkout session request:", req.body);
    const { amount, currency = "eur", userEmail, showtimeId, seats, userName } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    console.log("Creating Stripe Payment Intent...");
    // Create a PaymentIntent for embedded checkout UI (client-side)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        showtimeId: showtimeId || '',
        seats: seats || '',
        userName: userName || '',
      },
      description: `Movie Ticket Booking - ${seats} ticket(s)`,
    });

    console.log('Created Payment Intent:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      sessionId: paymentIntent.id, // For backward compatibility
    });
  } catch (error) {
    console.error("Stripe Payment Intent error:", error);
    res.status(500).json({ error: error.message || error.toString() });
  }
});

// Verify payment status
app.get("/verify-payment", async (req, res) => {
  try {
    let paymentIntentId = req.query.paymentIntentId;
    let sessionId = req.query.session_id;
    
    // Handle if frontend passes paymentIntentId as session_id
    // Detect by checking if it starts with 'pi_' (PaymentIntent ID format)
    if (!paymentIntentId && sessionId && sessionId.startsWith('pi_')) {
      console.log("Detected PaymentIntent ID passed as session_id parameter, correcting...");
      paymentIntentId = sessionId;
      sessionId = null;
    }
    
    // Handle both session-based and payment intent-based verification
    if (paymentIntentId) {
      console.log("Verifying PaymentIntent:", paymentIntentId);
      // Verify PaymentIntent status
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (stripeError) {
        console.error("Stripe PaymentIntent retrieval error:", stripeError.message);
        return res.status(400).json({ 
          success: false, 
          error: `Invalid PaymentIntent ID: ${paymentIntentId}`,
          message: "Payment verification failed. Invalid payment reference."
        });
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Payment was successful - create booking in database
        const userEmail = paymentIntent.receipt_email || 'guest@example.com';
        const userName = paymentIntent.metadata.userName || userEmail.split("@")[0];
        const showtimeId = paymentIntent.metadata.showtimeId;
        const seats = parseInt(paymentIntent.metadata.seats) || 1;
        
        if (!showtimeId) {
          return res.status(400).json({
            success: false,
            error: "Missing showtime information in payment metadata",
            message: "Cannot create booking: missing showtime details"
          });
        }
        
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          
          // Get or create user
          const uSel = await client.query(
            `SELECT user_id FROM public."user" WHERE email = $1 LIMIT 1`,
            [userEmail]
          );
          let userId;
          if (uSel.rows.length) {
            userId = uSel.rows[0].user_id;
          } else {
            const ins = await client.query(
              `INSERT INTO public."user"(name, email, password, role) VALUES ($1, $2, 'guest', 'customer') RETURNING user_id`,
              [userName, userEmail]
            );
            userId = ins.rows[0].user_id;
          }
          
          // Check if booking already exists for this payment
          const existingBooking = await client.query(
            `SELECT booking_id FROM booking WHERE user_id = $1 AND showtime_id = $2 ORDER BY created_at DESC LIMIT 1`,
            [userId, showtimeId]
          );
          
          let bookingId = null;
          if (existingBooking.rows.length > 0) {
            bookingId = existingBooking.rows[0].booking_id;
            // Update status
            await client.query(
              `UPDATE booking SET status = 'confirmed' WHERE booking_id = $1`,
              [bookingId]
            );
          } else {
            // Create new booking
            const bookingResult = await client.query(
              `INSERT INTO booking (user_id, showtime_id, seats, total_amount, status)
               VALUES ($1, $2, $3, $4, 'confirmed')
               RETURNING booking_id`,
              [userId, showtimeId, seats, paymentIntent.amount / 100]
            );
            bookingId = bookingResult.rows[0].booking_id;
          }
          
          // Get showtime details
          const showtimeQuery = await client.query(`
            SELECT s.showtime_id as id, s.movie_id, s.price, s.start_time, m.title, a.name as theater_name
            FROM showtime s
            JOIN movie m ON m.movie_id = s.movie_id
            JOIN auditorium a ON a.auditorium_id = s.auditorium_id
            WHERE s.showtime_id = $1
          `, [showtimeId]);
          
          await client.query("COMMIT");
          
          const showtime = showtimeQuery.rows[0] || {};
          console.log("Payment verified successfully. Booking ID:", bookingId);
          return res.json({
            success: true,
            payment_status: paymentIntent.status,
            bookingId: bookingId,
            movieTitle: showtime.title,
            showtime: showtime.start_time,
            theaterName: showtime.theater_name,
            seats: seats,
            total: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            customer_email: userEmail,
            paymentIntentId: paymentIntentId,
          });
        } catch (err) {
          await client.query("ROLLBACK");
          console.error("Database error during booking creation:", err);
          return res.json({
            success: true,
            payment_status: paymentIntent.status,
            message: "Payment verified but booking creation failed. Contact support.",
            paymentIntentId: paymentIntentId,
            error: err.message,
          });
        } finally {
          client.release();
        }
      }
      
      return res.json({
        success: false,
        payment_status: paymentIntent.status,
        message: `Payment not completed. Status: ${paymentIntent.status}. Please try again.`,
        paymentIntentId: paymentIntentId,
      });
    }
    
    // Original session-based verification
    if (!sessionId) {
      return res.status(400).json({ 
        error: "Missing payment reference",
        message: "session_id or paymentIntentId is required",
        hint: "Pass paymentIntentId or session_id as query parameter"
      });
    }

    console.log("Verifying Checkout Session:", sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // If payment was successful, create booking in database
    if (session.payment_status === 'paid' && session.metadata.showtimeId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Get or create user
        const userEmail = session.customer_email;
        const userName = session.metadata.userName || userEmail.split("@")[0];
        
        const uSel = await client.query(`SELECT user_id FROM public."user" WHERE email = $1 LIMIT 1`, [userEmail]);
        let userId;
        if (uSel.rows.length) {
          userId = uSel.rows[0].user_id;
        } else {
          const ins = await client.query(
            `INSERT INTO public."user"(name, email, password, role) VALUES ($1, $2, 'guest', 'customer') RETURNING user_id`,
            [userName, userEmail]
          );
          userId = ins.rows[0].user_id;
        }

        // Get showtime and movie details
        const showtimeQuery = await client.query(`
          SELECT s.showtime_id as id, s.movie_id, s.price, s.start_time, m.title, a.name as theater_name
          FROM showtime s
          JOIN movie m ON m.movie_id = s.movie_id
          JOIN auditorium a ON a.auditorium_id = s.auditorium_id
          WHERE s.showtime_id = $1
        `, [session.metadata.showtimeId]);

        if (showtimeQuery.rows.length > 0) {
          const showtime = showtimeQuery.rows[0];
          const seats = parseInt(session.metadata.seats) || 1;
          const total = session.amount_total / 100; // Convert from cents

          // Create booking
          const bookingResult = await client.query(
            `INSERT INTO booking (user_id, showtime_id, seats, total_amount, status)
             VALUES ($1, $2, $3, $4, 'confirmed')
             RETURNING booking_id`,
            [userId, session.metadata.showtimeId, seats, total]
          );

          await client.query("COMMIT");

          // Return complete booking information
          return res.json({
            success: true,
            id: session.id,
            payment_status: session.payment_status,
            bookingId: bookingResult.rows[0].booking_id,
            movieTitle: showtime.title,
            showtime: showtime.start_time,
            theaterName: showtime.theater_name,
            seats: seats,
            total: total,
            currency: session.currency,
            customer_email: session.customer_email,
          });
        } else {
          await client.query("ROLLBACK");
        }
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database error during booking creation:", err);
      } finally {
        client.release();
      }
    }

    // Return basic session info if booking creation failed or wasn't needed
    res.json({
      success: session.payment_status === 'paid',
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total / 100,
      total: session.amount_total / 100,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy payment status endpoint (kept for backward compatibility)
app.get("/payment-status/:paymentIntentId", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      req.params.paymentIntentId
    );

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error("Payment status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Stripe events (optional but recommended)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  // Skip webhook verification if webhook secret is not configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log("Webhook received but STRIPE_WEBHOOK_SECRET not configured, skipping verification");
    return res.json({ received: true, message: "Webhook secret not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("PaymentIntent was successful!", paymentIntent.id);
      // Update booking status in database if needed
      break;
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get Stripe publishable key (for frontend)
app.get("/config", (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// POST endpoint for payment confirmation (alternative to GET /verify-payment)
app.post("/confirm-payment", async (req, res) => {
  try {
    const { paymentIntentId, sessionId } = req.body;
    
    if (!paymentIntentId && !sessionId) {
      return res.status(400).json({ error: "paymentIntentId or sessionId is required" });
    }
    
    // Forward to verify-payment endpoint logic
    const queryParams = paymentIntentId 
      ? `?paymentIntentId=${paymentIntentId}` 
      : `?session_id=${sessionId}`;
    
    // Construct a mock request to reuse verify-payment logic
    res.redirect(`/verify-payment${queryParams}`);
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Direct PaymentIntent confirmation endpoint
app.post("/confirm-payment-intent", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false,
        error: "paymentIntentId is required",
        message: "Please provide a valid PaymentIntent ID"
      });
    }
    
    console.log("Confirming PaymentIntent (POST):", paymentIntentId);
    
    // Verify PaymentIntent status
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError) {
      console.error("Stripe error:", stripeError.message);
      return res.status(400).json({ 
        success: false, 
        error: `Invalid PaymentIntent ID: ${paymentIntentId}`,
        message: "Payment reference not found"
      });
    }
    
    if (paymentIntent.status === 'succeeded') {
      // Payment was successful - create booking in database
      const userEmail = paymentIntent.receipt_email || 'guest@example.com';
      const userName = paymentIntent.metadata.userName || userEmail.split("@")[0];
      const showtimeId = paymentIntent.metadata.showtimeId;
      const seats = parseInt(paymentIntent.metadata.seats) || 1;
      
      if (!showtimeId) {
        return res.status(400).json({
          success: false,
          error: "Missing showtime information",
          message: "Cannot create booking: missing showtime details"
        });
      }
      
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // Get or create user
        const uSel = await client.query(
          `SELECT user_id FROM public."user" WHERE email = $1 LIMIT 1`,
          [userEmail]
        );
        let userId;
        if (uSel.rows.length) {
          userId = uSel.rows[0].user_id;
        } else {
          const ins = await client.query(
            `INSERT INTO public."user"(name, email, password, role) VALUES ($1, $2, 'guest', 'customer') RETURNING user_id`,
            [userName, userEmail]
          );
          userId = ins.rows[0].user_id;
        }
        
        // Check if booking already exists
        const existingBooking = await client.query(
          `SELECT booking_id FROM booking WHERE user_id = $1 AND showtime_id = $2 ORDER BY created_at DESC LIMIT 1`,
          [userId, showtimeId]
        );
        
        let bookingId = null;
        if (existingBooking.rows.length > 0) {
          bookingId = existingBooking.rows[0].booking_id;
          await client.query(
            `UPDATE booking SET status = 'confirmed' WHERE booking_id = $1`,
            [bookingId]
          );
        } else {
          const bookingResult = await client.query(
            `INSERT INTO booking (user_id, showtime_id, seats, total_amount, status)
             VALUES ($1, $2, $3, $4, 'confirmed')
             RETURNING booking_id`,
            [userId, showtimeId, seats, paymentIntent.amount / 100]
          );
          bookingId = bookingResult.rows[0].booking_id;
        }
        
        // Get showtime details
        const showtimeQuery = await client.query(`
          SELECT s.showtime_id as id, s.movie_id, s.price, s.start_time, m.title, a.name as theater_name
          FROM showtime s
          JOIN movie m ON m.movie_id = s.movie_id
          JOIN auditorium a ON a.auditorium_id = s.auditorium_id
          WHERE s.showtime_id = $1
        `, [showtimeId]);
        
        await client.query("COMMIT");
        
        const showtime = showtimeQuery.rows[0] || {};
        console.log("PaymentIntent confirmed. Booking ID:", bookingId);
        
        return res.json({
          success: true,
          payment_status: paymentIntent.status,
          bookingId: bookingId,
          movieTitle: showtime.title,
          showtime: showtime.start_time,
          theaterName: showtime.theater_name,
          seats: seats,
          total: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          customer_email: userEmail,
          paymentIntentId: paymentIntentId,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          error: "Booking creation failed",
          message: "Payment verified but could not create booking",
          paymentIntentId: paymentIntentId,
        });
      } finally {
        client.release();
      }
    }
    
    // Payment not successful
    return res.json({
      success: false,
      payment_status: paymentIntent.status,
      message: `Payment status: ${paymentIntent.status}. Please try again or contact support.`,
      paymentIntentId: paymentIntentId,
    });
  } catch (error) {
    console.error("PaymentIntent confirmation error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: "An error occurred while confirming payment"
    });
  }
});

// Catch-all for debugging 404s
app.use((req, res, next) => {
  console.log(`404 - ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Not Found",
    message: `Route ${req.method} ${req.url} does not exist`,
    availableEndpoints: {
      createPayment: "POST /create-checkout-session",
      verifyPayment: "GET /verify-payment?paymentIntentId=... OR ?session_id=...",
      confirmPayment: "POST /confirm-payment (body: {paymentIntentId or sessionId})",
      confirmPaymentIntent: "POST /confirm-payment-intent (body: {paymentIntentId})",
      config: "GET /config",
      webhook: "POST /webhook"
    }
  });
});

const PORT = process.env.PORT || 8080;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log("JWT secret loaded:", process.env.JWT_SECRET ? "OK" : "MISSING");
  console.log("Stripe key loaded:", process.env.STRIPE_SECRET_KEY ? "OK" : "MISSING");

  // Simple database connectivity test
  pool
    .query("SELECT 1 AS ok")
    .then(r => {
      const row = r.rows[0];
      console.log("DB health check ok:", row);
    })
    .catch(err => {
      console.error("DB health check failed:", err.message);
    });
});
