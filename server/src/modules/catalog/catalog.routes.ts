import { Router } from "express";
import { catalogController } from "./catalog.controller.js";
import { authGuard } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/categories", authGuard, (req, res, next) =>
  catalogController.getCategories(req, res, next)
);
router.get("/products", authGuard, (req, res, next) =>
  catalogController.getProducts(req, res, next)
);
router.get("/products/:id", authGuard, (req, res, next) =>
  catalogController.getProduct(req, res, next)
);

export default router;
