import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { register, login, me, updateProfile, changePassword } from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").trim().notEmpty().withMessage("Phone is required").matches(/^[0-9+\-\s]{7,15}$/).withMessage("Enter a valid phone number"),
    body("age").optional({ values: "falsy" }).isInt({ min: 1, max: 120 }).withMessage("Enter a valid age"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", authenticate, me);

router.put(
  "/me",
  authenticate,
  [
    body("phone").optional().matches(/^[0-9+\-\s]{7,15}$/).withMessage("Enter a valid phone number"),
    body("age").optional({ values: "falsy" }).isInt({ min: 1, max: 120 }).withMessage("Enter a valid age"),
  ],
  validate,
  updateProfile
);

router.put(
  "/me/password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  validate,
  changePassword
);

export default router;
