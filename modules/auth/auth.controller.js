import { loginUserService, meService, registerUserService } from "./auth.service.js";

/**
 * Handle user registration.
 * Expects validated user data in req.body.
 * Delegates creation logic to registerUserService.
 */
export async function registerController(req, res, next) {
  try {
    const result = await registerUserService(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e); // Pass error to global error handler
  }
}

/**
 * Handle user login.
 * Service returns JWT + user info if authentication succeeds.
 */
export async function loginController(req, res, next) {
  try {
    const result = await loginUserService(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

/**
 * Returns the authenticated user's profile.
 * req.user is set by authentication middleware after verifying JWT.
 */
export async function meController(req, res, next) {
  try {
    const user = await meService(req.user.userId);
    res.json({ user });
  } catch (e) {
    next(e);
  }
}
