import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { uploadReport as uploadReportMiddleware } from "../middleware/upload.js";
import { listReports, uploadReport, deleteReport } from "../controllers/report.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listReports);

router.post(
  "/",
  authorize("admin"),
  uploadReportMiddleware.single("file"),
  [
    body("patientId").isInt().withMessage("Patient is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
  ],
  validate,
  uploadReport
);

router.delete("/:id", authorize("admin"), deleteReport);

export default router;
