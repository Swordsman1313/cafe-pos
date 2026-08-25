import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authGuard, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/login-pin", (req, res, next) => authController.pinLogin(req, res, next));
router.get("/me", authGuard, (req, res, next) => authController.getMe(req, res, next));
router.get("/staff", authGuard, requireRole("OWNER", "MANAGER"), (req, res, next) =>
  authController.getStaff(req, res, next)
);

export default router;
