import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service.js";

export class AnalyticsController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const summary = await analyticsService.getDashboardSummary(storeId);
      return res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
