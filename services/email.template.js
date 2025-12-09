/**
 * Professional Email Template for Filmpass Booking Confirmations
 */

export function generateProfessionalEmailHTML(bookingData) {
  const {
    bookingId,
    customerName,
    movieTitle,
    moviePoster,
    showtimeDate,
    showtimeTime,
    theaterName,
    theaterLocation,
    auditoriumNumber,
    seats,
    numberOfTickets,
    totalAmount,
    currency,
    paymentMethod,
    bookingTimestamp,
  } = bookingData;

  const formatCurrency = (amount, curr = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - Filmpass</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f0f2f5;
            color: #333333;
            line-height: 1.6;
        }
        .email-wrapper {
            background-color: #f0f2f5;
            padding: 20px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120"><path fill="rgba(255,255,255,0.05)" d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path></svg>') no-repeat bottom;
            background-size: cover;
            opacity: 0.3;
        }
        .logo-container {
            position: relative;
            z-index: 1;
        }
        .logo {
            font-size: 36px;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        .logo-tagline {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
        }
        .success-banner {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .success-title {
            font-size: 24px;
            font-weight: 700;
            margin: 10px 0 5px;
        }
        .success-subtitle {
            font-size: 14px;
            opacity: 0.95;
        }
        .greeting {
            font-size: 20px;
            margin-bottom: 15px;
            color: #1f2937;
            font-weight: 600;
        }
        .intro-text {
            color: #6b7280;
            margin-bottom: 25px;
            font-size: 15px;
        }
        .confirmation-number {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px dashed #3b82f6;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 25px 0;
        }
        .confirmation-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .confirmation-id {
            font-size: 28px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 3px;
            font-family: 'Courier New', monospace;
        }
        .movie-section {
            margin: 30px 0;
            padding: 25px;
            background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
            border-radius: 12px;
            border-left: 5px solid #f59e0b;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .movie-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .movie-icon {
            font-size: 32px;
            margin-right: 15px;
        }
        .movie-title {
            font-size: 26px;
            font-weight: 800;
            color: #1f2937;
            margin: 0;
            line-height: 1.2;
        }
        .movie-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        .meta-item {
            display: flex;
            align-items: center;
            font-size: 15px;
            color: #374151;
        }
        .meta-icon {
            font-size: 18px;
            margin-right: 8px;
        }
        .meta-value {
            font-weight: 600;
        }
        .details-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            margin: 25px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .details-header {
            background: #f9fafb;
            padding: 15px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .details-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        .details-body {
            padding: 20px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .detail-row:first-child {
            padding-top: 0;
        }
        .detail-label {
            font-size: 14px;
            color: #6b7280;
            display: flex;
            align-items: center;
        }
        .detail-icon {
            margin-right: 8px;
            font-size: 16px;
        }
        .detail-value {
            font-size: 15px;
            color: #1f2937;
            font-weight: 600;
            text-align: right;
        }
        .seats-highlight {
            color: #3b82f6;
            font-weight: 700;
            font-size: 16px;
        }
        .total-section {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .total-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        .total-amount {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 1px;
        }
        .ticket-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }
        .ticket-icon {
            font-size: 64px;
            margin-bottom: 15px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .ticket-text {
            font-size: 15px;
            color: #1e40af;
            font-weight: 600;
            line-height: 1.5;
        }
        .instructions-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .instructions-title {
            font-size: 16px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .instructions-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .instructions-list li {
            color: #78350f;
            margin: 8px 0;
            padding-left: 25px;
            position: relative;
            font-size: 14px;
        }
        .instructions-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
        }
        .support-section {
            background: #f9fafb;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .support-text {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .support-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
        .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 35px 30px;
            text-align: center;
        }
        .footer-brand {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 15px;
        }
        .footer-tagline {
            font-size: 13px;
            margin-bottom: 20px;
            opacity: 0.8;
        }
        .footer-links {
            margin: 20px 0;
        }
        .footer-link {
            color: #60a5fa;
            text-decoration: none;
            margin: 0 12px;
            font-size: 13px;
        }
        .footer-link:hover {
            color: #93c5fd;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-icon {
            font-size: 20px;
            margin: 0 10px;
            text-decoration: none;
        }
        .footer-copyright {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 10px 0;
            }
            .content {
                padding: 25px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .logo {
                font-size: 28px;
            }
            .success-title {
                font-size: 20px;
            }
            .confirmation-id {
                font-size: 22px;
            }
            .movie-title {
                font-size: 22px;
            }
            .movie-meta {
                flex-direction: column;
                gap: 10px;
            }
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .detail-value {
                text-align: left;
                margin-top: 5px;
            }
            .total-amount {
                font-size: 28px;
            }
            .footer-links {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo-container">
                    <h1 class="logo">🎬 FILMPASS</h1>
                    <div class="logo-tagline">YOUR PREMIUM CINEMA EXPERIENCE</div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="content">
                <!-- Success Banner -->
                <div class="success-banner">
                    <div class="success-icon">✓</div>
                    <div class="success-title">Booking Confirmed!</div>
                    <div class="success-subtitle">Your tickets are ready</div>
                </div>
                
                <!-- Greeting -->
                <div class="greeting">Hello ${customerName},</div>
                <p class="intro-text">
                    Thank you for choosing Filmpass! We're excited to have you join us for an amazing movie experience. 
                    Your booking has been confirmed and your tickets are ready.
                </p>
                
                <!-- Confirmation Number -->
                <div class="confirmation-number">
                    <div class="confirmation-label">Booking Confirmation Number</div>
                    <div class="confirmation-id">#${bookingId}</div>
                </div>
                
                <!-- Movie Section -->
                <div class="movie-section">
                    <div class="movie-header">
                        <div class="movie-icon">🎥</div>
                        <h2 class="movie-title">${movieTitle}</h2>
                    </div>
                    <div class="movie-meta">
                        <div class="meta-item">
                            <span class="meta-icon">📅</span>
                            <span class="meta-value">${formatDate(showtimeDate)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-icon">🕐</span>
                            <span class="meta-value">${showtimeTime || formatTime(showtimeDate)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Booking Details Card -->
                <div class="details-card">
                    <div class="details-header">
                        <h3 class="details-title">📋 Booking Details</h3>
                    </div>
                    <div class="details-body">
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">🎭</span>
                                Theater
                            </span>
                            <span class="detail-value">${theaterName}</span>
                        </div>
                        ${
                          theaterLocation
                            ? `
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">📍</span>
                                Location
                            </span>
                            <span class="detail-value">${theaterLocation}</span>
                        </div>
                        `
                            : ""
                        }
                        ${
                          auditoriumNumber
                            ? `
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">🚪</span>
                                Auditorium
                            </span>
                            <span class="detail-value">${auditoriumNumber}</span>
                        </div>
                        `
                            : ""
                        }
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">💺</span>
                                Seat Numbers
                            </span>
                            <span class="detail-value seats-highlight">${seats}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">🎫</span>
                                Tickets
                            </span>
                            <span class="detail-value">${numberOfTickets} ${numberOfTickets === 1 ? "Ticket" : "Tickets"}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">
                                <span class="detail-icon">💳</span>
                                Payment
                            </span>
                            <span class="detail-value">${paymentMethod}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Total Section -->
                <div class="total-section">
                    <div class="total-label">Total Amount Paid</div>
                    <div class="total-amount">${formatCurrency(totalAmount, currency)}</div>
                </div>
                
                <!-- Digital Ticket -->
                <div class="ticket-section">
                    <div class="ticket-icon">🎟️</div>
                    <div class="ticket-text">
                        <strong>This is your digital ticket</strong><br/>
                        Show this email or your confirmation number at the entrance
                    </div>
                </div>
                
                <!-- Instructions -->
                <div class="instructions-box">
                    <div class="instructions-title">
                        ⚠️ Important Information
                    </div>
                    <ul class="instructions-list">
                        <li>Please arrive at least 15 minutes before showtime</li>
                        <li>Present this email or confirmation number at the entrance</li>
                        <li>Tickets are non-refundable and non-transferable</li>
                        <li>Outside food and beverages are not permitted</li>
                        <li>Late entry may not be permitted after movie starts</li>
                    </ul>
                </div>
                
                <!-- Support Section -->
                <div class="support-section">
                    <div class="support-text">Need help with your booking?</div>
                    <a href="mailto:support@filmpass.com" class="support-link">Contact Support</a>
                </div>
                
                <p style="text-align: center; margin-top: 35px; color: #6b7280; font-size: 15px;">
                    Enjoy your movie! 🍿🎬<br/>
                    <strong style="color: #1f2937;">The Filmpass Team</strong>
                </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-brand">FILMPASS</div>
                <div class="footer-tagline">Your Premium Cinema Experience</div>
                
                <div class="footer-links">
                    <a href="#" class="footer-link">About Us</a>
                    <a href="#" class="footer-link">Locations</a>
                    <a href="#" class="footer-link">Help Center</a>
                    <a href="#" class="footer-link">Terms</a>
                    <a href="#" class="footer-link">Privacy</a>
                </div>
                
                <div class="social-links">
                    <a href="#" class="social-icon">📘</a>
                    <a href="#" class="social-icon">📷</a>
                    <a href="#" class="social-icon">🐦</a>
                </div>
                
                <div class="footer-copyright">
                    © ${new Date().getFullYear()} Filmpass Cinema. All rights reserved.<br/>
                    This email was sent to you regarding your booking #${bookingId}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export function generatePlainTextEmail(bookingData) {
  const {
    bookingId,
    customerName,
    movieTitle,
    showtimeDate,
    showtimeTime,
    theaterName,
    theaterLocation,
    auditoriumNumber,
    seats,
    numberOfTickets,
    totalAmount,
    currency,
    paymentMethod,
  } = bookingData;

  const formatCurrency = (amount, curr = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
    }).format(amount);
  };

  return `
═══════════════════════════════════════════════════
🎬 FILMPASS - BOOKING CONFIRMATION
═══════════════════════════════════════════════════

✓ BOOKING CONFIRMED

Hello ${customerName},

Thank you for choosing Filmpass! Your booking has been confirmed 
and your tickets are ready.

---------------------------------------------------
CONFIRMATION NUMBER: #${bookingId}
---------------------------------------------------

🎥 MOVIE DETAILS
---------------------------------------------------
Title: ${movieTitle}
Date: ${new Date(showtimeDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Time: ${showtimeTime || new Date(showtimeDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}

📋 BOOKING DETAILS
---------------------------------------------------
🎭 Theater: ${theaterName}
${theaterLocation ? `📍 Location: ${theaterLocation}` : ""}
${auditoriumNumber ? `🚪 Auditorium: ${auditoriumNumber}` : ""}
💺 Seats: ${seats}
🎫 Tickets: ${numberOfTickets}
💳 Payment: ${paymentMethod}

💰 TOTAL PAID: ${formatCurrency(totalAmount, currency)}
---------------------------------------------------

🎟️ DIGITAL TICKET
This is your digital ticket. Show this email or your 
confirmation number at the entrance.

⚠️ IMPORTANT INFORMATION
• Please arrive at least 15 minutes before showtime
• Present this email or confirmation number at entrance
• Tickets are non-refundable and non-transferable
• Outside food and beverages are not permitted
• Late entry may not be permitted after movie starts

Need help? Contact us at support@filmpass.com

Enjoy your movie! 🍿🎬

The Filmpass Team

═══════════════════════════════════════════════════
© ${new Date().getFullYear()} Filmpass Cinema. All rights reserved.
═══════════════════════════════════════════════════
  `;
}
