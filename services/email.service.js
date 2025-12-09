import nodemailer from "nodemailer";
import { generateProfessionalEmailHTML, generatePlainTextEmail } from "./email.template.js";

/**
 * Email Service for Filmpass
 * Handles sending booking confirmation emails and other transactional emails
 */

// Email configuration from environment variables
const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || "gmail",
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: {
    email: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    name: process.env.EMAIL_FROM_NAME || "Filmpass Cinema",
  },
};

/**
 * Create and configure nodemailer transporter
 * Supports multiple email services (Gmail, SendGrid, AWS SES, etc.)
 */
function createTransporter() {
  const config = {
    auth: EMAIL_CONFIG.auth,
  };

  // Use service name (gmail, etc.) or custom SMTP settings
  if (EMAIL_CONFIG.service && EMAIL_CONFIG.service !== "custom") {
    config.service = EMAIL_CONFIG.service;
  } else if (EMAIL_CONFIG.host) {
    config.host = EMAIL_CONFIG.host;
    config.port = EMAIL_CONFIG.port;
    config.secure = EMAIL_CONFIG.secure;
  } else {
    throw new Error("Email service not properly configured");
  }

  return nodemailer.createTransport(config);
}

/**
 * Send booking confirmation email
 * @param {Object} bookingData - Complete booking information
 * @param {string} recipientEmail - Customer email address
 * @returns {Promise<Object>} Email send result with success status
 */
export async function sendBookingConfirmationEmail(bookingData, recipientEmail) {
  try {
    // Validate email configuration
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.error("Email service not configured. Missing EMAIL_USER or EMAIL_PASSWORD.");
      return {
        success: false,
        error: "Email service not configured",
        shouldRetry: false,
      };
    }

    console.log(`📧 Attempting to send email to ${recipientEmail}...`);
    console.log(`📧 Using email service: ${EMAIL_CONFIG.service}`);
    console.log(`📧 Email user: ${EMAIL_CONFIG.auth.user}`);
    
    const transporter = createTransporter();

    const htmlContent = generateProfessionalEmailHTML(bookingData);
    const textContent = generatePlainTextEmail(bookingData);

    const mailOptions = {
      from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.email}>`,
      to: recipientEmail,
      subject: `Your Filmpass Booking Confirmation - ${bookingData.movieTitle}`,
      text: textContent,
      html: htmlContent,
    };

    // Send email
    console.log(`📧 Sending email...`);
    const info = await transporter.sendMail(mailOptions);

    console.log(`✓ Booking confirmation email sent to ${recipientEmail} (MessageID: ${info.messageId})`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: recipientEmail,
    };
  } catch (error) {
    console.error("❌ Failed to send booking confirmation email:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });

    // Determine if error is retryable
    const retryableErrors = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"];
    const shouldRetry = retryableErrors.some((errCode) => error.code === errCode);

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      shouldRetry,
    };
  }
}

/**
 * Send email with retry logic
 * Attempts to send email up to maxRetries times with exponential backoff
 * @param {Object} bookingData - Booking information
 * @param {string} recipientEmail - Customer email
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} Final send result
 */
export async function sendBookingConfirmationEmailWithRetry(
  bookingData,
  recipientEmail,
  maxRetries = 3
) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendBookingConfirmationEmail(bookingData, recipientEmail);

    if (result.success) {
      if (attempt > 1) {
        console.log(`✓ Email sent successfully on attempt ${attempt}`);
      }
      return result;
    }

    lastError = result;

    // Don't retry if error is not retryable
    if (!result.shouldRetry) {
      console.log(`✗ Email send failed with non-retryable error: ${result.error}`);
      break;
    }

    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
      console.log(`⚠ Email send attempt ${attempt} failed. Retrying in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.error(`✗ Failed to send email after ${maxRetries} attempts`);
  return lastError;
}

/**
 * Verify email configuration is valid
 * @returns {Promise<boolean>} True if email service is properly configured
 */
export async function verifyEmailConfig() {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log("✓ Email service configured and ready");
    return true;
  } catch (error) {
    console.error("✗ Email service configuration invalid:", error.message);
    return false;
  }
}

export default {
  sendBookingConfirmationEmail,
  sendBookingConfirmationEmailWithRetry,
  verifyEmailConfig,
};
