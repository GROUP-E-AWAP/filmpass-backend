import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/**
 * Middleware that enforces authentication via JWT.
 * Expects the client to send Authorization: Bearer <token>.
 * If the token is valid, decoded user info is attached to req.user.
 */
export function requireAuth(req, res, next) {
  const header = req.get("Authorization");

  // Reject requests without a proper Bearer token format
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.split(" ")[1];

  try {
    // Verify JWT signature & expiration
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach the decoded payload to the request object
    // Example payload: { userId, email, role }
    req.user = decoded;

    next();
  } catch (e) {
    console.error("JWT VERIFY ERROR:", e.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware factory to restrict access based on user roles.
 * Usage example: requireRole("admin", "manager")
 * If req.user.role is not included, access is denied.
 */
export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      // Should not happen if requireAuth is used before this middleware
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if the authenticated user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
