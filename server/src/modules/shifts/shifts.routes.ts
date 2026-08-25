import { Router } from "express";
import { shiftsController } from "./shifts.controller.js";
import { authGuard, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/current", authGuard, (req, res, next) =>
  shiftsController.getCurrentShift(req, res, next)
);
router.post("/open", authGuard, (req, res, next) =>
  shiftsController.openShift(req, res, next)
);
router.post("/movement", authGuard, (req, res, next) =>
  shiftsController.recordMovement(req, res, next)
);
router.post("/close", authGuard, requireRole("OWNER", "MANAGER", "CASHIER"), (req, res, next) =>
  shiftsController.closeShift(req, res, next)
);
router.get("/:id/z-report", authGuard, (req, res, next) =>
  shiftsController.getZReport(req, res, next)
);

export default router;
