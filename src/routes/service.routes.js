import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listServices, createService, updateService, deleteService } from "../controllers/service.controller.js";

const router = Router();

router.get("/", listServices);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  [body("name").trim().notEmpty().withMessage("Name is required")],
  validate,
  createService
);
router.put("/:id", authenticate, authorize("admin"), updateService);
router.delete("/:id", authenticate, authorize("admin"), deleteService);

export default router;
