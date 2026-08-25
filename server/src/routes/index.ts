import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import catalogRoutes from "../modules/catalog/catalog.routes.js";
import inventoryRoutes from "../modules/inventory/inventory.routes.js";
import ordersRoutes from "../modules/orders/orders.routes.js";
import shiftsRoutes from "../modules/shifts/shifts.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import paymentsRoutes from "../modules/payments/payments.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/orders", ordersRoutes);
router.use("/shifts", shiftsRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/payments", paymentsRoutes);

export default router;
