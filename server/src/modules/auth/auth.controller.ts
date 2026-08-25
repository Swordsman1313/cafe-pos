import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "./auth.service.js";

const pinLoginSchema = z.object({
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8),
  storeCode: z.string().optional(),
});

export class AuthController {
  async pinLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = pinLoginSchema.parse(req.body);
      const result = await authService.quickPinLogin(validated.pin, validated.storeCode);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      return res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const staff = await authService.getStaffList(storeId);
      return res.status(200).json({
        success: true,
        data: staff,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
