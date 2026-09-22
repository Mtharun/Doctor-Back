import { Router } from "express";
import { body, query } from "express-validator";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  listDentists,
  createDentist,
  updateDentist,
  deleteDentist,
  getAvailability,
} from "../controllers/dentist.controller.js";

const router = Router();

router.get("/", listDentists);
router.get(
  "/:id/availability",
  [query("date").isISO8601().withMessage("A valid date is required")],
  validate,
  getAvailability
);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  [body("name").trim().notEmpty(), body("specialty").trim().notEmpty()],
  validate,
  createDentist
);
router.put("/:id", authenticate, authorize("admin"), updateDentist);
router.delete("/:id", authenticate, authorize("admin"), deleteDentist);

export default router;
