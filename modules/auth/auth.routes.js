import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { registerSchema, loginSchema } from "../../validation/authSchemas.js";
import {
  loginController,
  meController,
  registerController
} from "./auth.controller.js";

const router = Router();

/**
 * POST /auth/register
 * Validates registration payload and creates a new user.
 */
router.post("/register", validate(registerSchema), registerController);

/**
 * POST /auth/login
 * Validates credentials and returns a JWT token if successful.
 */
router.post("/login", validate(loginSchema), loginController);

/**
 * GET /auth/me
 * Requires a valid JWT.
 * Returns profile data of the authenticated user.
 */
router.get("/me", requireAuth, meController);

export default router;