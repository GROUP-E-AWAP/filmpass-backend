-- Migration: Add email tracking to bookings table
-- This migration adds email notification tracking to the booking system

-- Add email tracking columns to booking table
ALTER TABLE booking 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Create index for querying bookings that need email resend
CREATE INDEX IF NOT EXISTS idx_booking_email_sent ON booking(email_sent, created_at);

-- Optional: Create email_logs table for detailed email tracking and debugging
CREATE TABLE IF NOT EXISTS email_log (
    log_id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES booking(booking_id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL DEFAULT 'booking_confirmation',
    subject VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'pending'
    message_id VARCHAR(255),
    error_message TEXT,
    attempt_number INTEGER DEFAULT 1,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email log queries
CREATE INDEX IF NOT EXISTS idx_email_log_booking ON email_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status, sent_at);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient ON email_log(recipient_email);

-- Add comments for documentation
COMMENT ON COLUMN booking.email_sent IS 'Indicates if booking confirmation email was successfully sent';
COMMENT ON COLUMN booking.email_sent_at IS 'Timestamp when confirmation email was sent';
COMMENT ON COLUMN booking.email_attempts IS 'Number of email send attempts';
COMMENT ON COLUMN booking.email_error IS 'Last email send error message if failed';

COMMENT ON TABLE email_log IS 'Detailed log of all email communications for debugging and audit';
COMMENT ON COLUMN email_log.email_type IS 'Type of email: booking_confirmation, reminder, cancellation, etc.';
COMMENT ON COLUMN email_log.status IS 'Email delivery status: sent, failed, pending';
COMMENT ON COLUMN email_log.message_id IS 'Email service message ID for tracking';
