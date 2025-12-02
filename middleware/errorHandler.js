export function errorHandler(err, req, res, _next) {
  console.error("UNHANDLED ERROR:", err);

  // Determine correct HTTP status code.
  // Custom errors may set err.statusCode; otherwise fallback to 500.
  const status = err.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  // In production: hide detailed error messages.
  // In development: expose original error message to speed up debugging.
  const payload =
    process.env.NODE_ENV === "production"
      ? { error: "Internal server error" }
      : { error: err.message || "Internal server error" };

  res.status(status).json(payload);
}
