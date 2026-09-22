import { ApiError } from "../utils/ApiError.js";

// Express recognizes this as an error-handling middleware because it takes
// 4 arguments. Every asyncHandler-wrapped controller error lands here.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  // node:sqlite constraint errors that slipped through a controller's own
  // try/catch (defence in depth - most are already caught explicitly).
  if (err.code === "ERR_SQLITE_ERROR") {
    if (err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ success: false, message: "That record already exists or conflicts with an existing one." });
    }
    if (err.message?.includes("FOREIGN KEY constraint failed")) {
      return res.status(400).json({ success: false, message: "That references a record which doesn't exist." });
    }
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Request blocked by CORS policy." });
  }

  // Multer file-size / type errors
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Never leak internal error details/stack traces to the client.
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again.",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}
