import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentStats,
} from "../controllers/appointment.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listAppointments);
router.get("/stats", authorize("admin"), getAppointmentStats);
router.get("/:id", getAppointment);

router.post(
  "/",
  authorize("patient"),
  [
    body("dentistId").isInt().withMessage("Dentist is required"),
    body("serviceId").isInt().withMessage("Service is required"),
    body("date").isISO8601().withMessage("A valid date is required"),
    body("time").matches(/^\d{2}:\d{2}$/).withMessage("A valid time is required"),
    body("reason").optional().isLength({ max: 1000 }),
  ],
  validate,
  createAppointment
);

router.put(
  "/:id/status",
  [body("status").isIn(["pending", "confirmed", "completed", "cancelled", "rejected"])],
  validate,
  updateAppointmentStatus
);

router.put(
  "/:id/reschedule",
  [
    body("date").isISO8601().withMessage("A valid date is required"),
    body("time").matches(/^\d{2}:\d{2}$/).withMessage("A valid time is required"),
  ],
  validate,
  rescheduleAppointment
);

export default router;
