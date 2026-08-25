import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { shiftsService } from "./shifts.service.js";

const openShiftSchema = z.object({
  startingFloatUSD: z.number().min(0).default(50.0),
  startingFloatKHR: z.number().min(0).default(200000),
  notes: z.string().optional(),
});

const recordMovementSchema = z.object({
  shiftId: z.string().min(1, "Shift ID required"),
  type: z.enum(["PAY_IN", "PAY_OUT", "CASH_DROP"]),
  amountUSD: z.number().min(0),
  amountKHR: z.number().optional().default(0),
  reason: z.string().min(1, "Reason is required"),
});

const closeShiftSchema = z.object({
  shiftId: z.string().min(1, "Shift ID required"),
  endingCashActualUSD: z.number().min(0),
  endingCashActualKHR: z.number().min(0),
  notes: z.string().optional(),
});

export class ShiftsController {
  async getCurrentShift(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const shift = await shiftsService.getCurrentShift(storeId);
      return res.status(200).json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  }

  async openShift(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const cashierId = req.user?.userId || "user-cashier-01";
      const validated = openShiftSchema.parse(req.body);
      const shift = await shiftsService.openShift({
        ...validated,
        storeId,
        cashierId,
      });
      return res.status(201).json({ success: true, data: shift });
    } catch (err) {
      next(err);
    }
  }

  async recordMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = recordMovementSchema.parse(req.body);
      const movement = await shiftsService.recordMovement({
        ...validated,
        authorizedById: req.user?.userId,
      });
      return res.status(201).json({ success: true, data: movement });
    } catch (err) {
      next(err);
    }
  }

  async closeShift(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = closeShiftSchema.parse(req.body);
      const result = await shiftsService.closeShift(validated);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getZReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const zReport = await shiftsService.getZReport(id);
      return res.status(200).json({ success: true, data: zReport });
    } catch (err) {
      next(err);
    }
  }
}

export const shiftsController = new ShiftsController();
