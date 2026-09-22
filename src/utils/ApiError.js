// A small typed error class so controllers can throw a specific HTTP
// status + message, and the central error handler knows how to respond.
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
