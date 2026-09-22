import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

// Run after an array of express-validator checks on a route; turns any
// validation failures into a single clean 422 response for the frontend.
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, "Please check the form for errors.", errors.array());
  }
  next();
}
