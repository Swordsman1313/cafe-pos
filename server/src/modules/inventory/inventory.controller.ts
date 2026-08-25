import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { inventoryService } from "./inventory.service.js";

const adjustStockSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID required"),
  type: z.enum(["RESTOCK", "WASTE_SPILLAGE", "AUDIT_ADJUSTMENT"]),
  quantity: z.number().positive("Quantity must be positive"),
  notes: z.string().optional(),
});

export class InventoryController {
  async getIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const ingredients = await inventoryService.getIngredients(storeId);
      return res.status(200).json({ success: true, data: ingredients });
    } catch (err) {
      next(err);
    }
  }

  async getLowStockAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const alerts = await inventoryService.getLowStockAlerts(storeId);
      return res.status(200).json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const limit = parseInt(req.query.limit as string) || 50;
      const txs = await inventoryService.getStockTransactions(storeId, limit);
      return res.status(200).json({ success: true, data: txs });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const validated = adjustStockSchema.parse(req.body);
      const result = await inventoryService.adjustStock(storeId, {
        ...validated,
        staffId: req.user?.userId,
      });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
