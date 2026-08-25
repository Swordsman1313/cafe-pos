import { Router } from "express";
import { analyticsController } from "./analytics.controller.js";
import { authGuard, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/summary", authGuard, requireRole("OWNER", "MANAGER"), (req, res, next) =>
  analyticsController.getDashboardSummary(req, res, next)
);

export default router;
