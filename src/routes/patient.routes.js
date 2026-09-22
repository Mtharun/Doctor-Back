import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { listPatients, getPatientDetail } from "../controllers/patient.controller.js";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", listPatients);
router.get("/:id", getPatientDetail);

export default router;
