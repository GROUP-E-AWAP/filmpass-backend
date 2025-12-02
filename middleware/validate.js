/**
 * Generic request body validation middleware.
 * Accepts a Joi schema and validates req.body against it.
 * If validation fails, respond with HTTP 400 and a descriptive error.
 * Otherwise replaces req.body with the sanitized/validated value.
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      // Provide the first validation error message for clarity
      return res.status(400).json({ error: error.details[0].message });
    }

    // Replace body with the validated/sanitized value
    req.body = value;
    next();
  };
}
