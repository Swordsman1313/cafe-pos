import { Router } from "express";
import { inventoryController } from "./inventory.controller.js";
import { authGuard, requireRole } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/ingredients", authGuard, (req, res, next) =>
  inventoryController.getIngredients(req, res, next)
);
router.get("/alerts", authGuard, (req, res, next) =>
  inventoryController.getLowStockAlerts(req, res, next)
);
router.get("/transactions", authGuard, (req, res, next) =>
  inventoryController.getTransactions(req, res, next)
);
router.post("/adjust", authGuard, requireRole("OWNER", "MANAGER", "CASHIER"), (req, res, next) =>
  inventoryController.adjustStock(req, res, next)
);

export default router;
