import { query } from "../../config/db.js";

/**
 * Look up a user by email.
 * Used during login and registration checks.
 * Returns user_id, name, email, password hash, and role.
 */
export async function findUserByEmail(email) {
  const result = await query(
    `SELECT user_id, name, email, password, role
       FROM public."user"
      WHERE email = $1
      LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Fetch a user profile by ID.
 * Does not include password for security reasons.
 */
export async function findUserById(userId) {
  const result = await query(
    `SELECT user_id, name, email, role
       FROM public."user"
      WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user account.
 * Password must be hashed *before* calling this function.
 * Default role = customer unless explicitly provided.
 */
export async function createUser(name, email, passwordHash, role = "customer") {
  const result = await query(
    `INSERT INTO public."user"(name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role`,
    [name, email, passwordHash, role]
  );
  return result.rows[0];
}
