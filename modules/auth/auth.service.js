import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById } from "./auth.repository.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Generate a signed JWT containing user identity + role.
 * Token expires in 2 hours (sufficient for a standard session).
 */
function generateToken(userRow) {
  return jwt.sign(
    {
      userId: userRow.user_id,
      email: userRow.email,
      role: userRow.role
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

/**
 * Register a new customer.
 * Steps:
 *  1. Check if user already exists by email.
 *  2. Hash the password.
 *  3. Determine displayName (fallback: part before @).
 *  4. Create user record.
 *  5. Issue JWT token for immediate login.
 */
export async function registerUserService({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error("User with this email already exists");
    err.statusCode = 409; // Conflict
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  // Fallback display name if user didn't provide one
  const displayName = name && name.trim() ? name.trim() : email.split("@")[0];

  const user = await createUser(displayName, email, hash, "customer");
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Authenticate user using email + password.
 * If valid:
 *   - return JWT
 *   - return basic user profile
 * Credentials are validated before generating the token.
 */
export async function loginUserService({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  // Compare plain password with stored hash
  const matches = await bcrypt.compare(password, user.password || "");
  if (!matches) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * Return user profile for the authenticated user.
 * Used for /auth/me endpoint after JWT middleware sets req.user.
 */
export async function meService(userId) {
  const user = await findUserById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
