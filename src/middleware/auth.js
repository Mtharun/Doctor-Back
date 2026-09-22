import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserModel } from "../models/user.model.js";

// Reads the "Authorization: Bearer <token>" header, verifies the JWT, and
// loads the current user onto req.user. Every protected route uses this.
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "You must be logged in to do that.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Your session has expired. Please log in again.");
  }

  const user = UserModel.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, "Account no longer exists.");
  }

  req.user = user;
  next();
});

// Usage: authorize("admin") or authorize("patient", "admin")
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "You do not have permission to do that.");
  }
  next();
};
