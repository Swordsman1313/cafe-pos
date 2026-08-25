import { Router } from "express";
import { ordersController } from "./orders.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/checkout", authGuard, (req, res, next) =>
  ordersController.createOrder(req, res, next)
);
router.get("/", authGuard, (req, res, next) =>
  ordersController.getOrders(req, res, next)
);
router.get("/:id", authGuard, (req, res, next) =>
  ordersController.getOrderById(req, res, next)
);
router.patch("/:id/status", authGuard, (req, res, next) =>
  ordersController.updateStatus(req, res, next)
);

export default router;
