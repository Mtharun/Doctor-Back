import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadEmergencyImage } from "../middleware/upload.js";
import {
  listEmergencyRequests,
  createEmergencyRequest,
  updateEmergencyStatus,
} from "../controllers/emergency.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listEmergencyRequests);

router.post(
  "/",
  authorize("patient"),
  uploadEmergencyImage.single("image"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("priority").isIn(["critical", "high", "medium"]),
  ],
  validate,
  createEmergencyRequest
);

router.put(
  "/:id/status",
  [body("status").isIn(["pending", "accepted", "in_progress", "resolved", "cancelled"])],
  validate,
  updateEmergencyStatus
);

export default router;
