import { Router } from "express";
import { paymentsController } from "./payments.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/dynamic-qr", authGuard, (req, res, next) =>
  paymentsController.generateQR(req, res, next)
);
router.post("/webhook", (req, res, next) =>
  paymentsController.handleWebhook(req, res, next)
);
router.get("/print/receipt/:orderId", authGuard, (req, res, next) =>
  paymentsController.getPrintReceipt(req, res, next)
);
router.get("/print/kitchen/:orderId", authGuard, (req, res, next) =>
  paymentsController.getPrintKitchenTicket(req, res, next)
);

export default router;
