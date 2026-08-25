import { Request, Response, NextFunction } from "express";
import { catalogService } from "./catalog.service.js";

export class CatalogController {
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || "tenant-001";
      const categories = await catalogService.getCategories(tenantId);
      return res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || "tenant-001";
      const categoryId = req.query.category as string | undefined;
      const products = await catalogService.getProducts(tenantId, categoryId);
      return res.status(200).json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await catalogService.getProductById(id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      return res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
}

export const catalogController = new CatalogController();
