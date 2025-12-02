import Joi from "joi";

/**
 * Validation schema for user registration.
 * Name is optional; email and password are required.
 */
export const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});

/**
 * Validation schema for user login.
 * Basic email + password validation only.
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});
