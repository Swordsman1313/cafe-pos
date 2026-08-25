import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ordersService } from "./orders.service.js";

const createOrderSchema = z.object({
  storeId: z.string().optional(),
  channel: z.enum(["WALK_IN", "TAKEAWAY", "DELIVERY", "DINE_IN"]).default("WALK_IN"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID required"),
      quantity: z.number().int().positive().default(1),
      notes: z.string().optional(),
      modifiers: z
        .array(
          z.object({
            modifierOptionId: z.string().optional().default("custom"),
            groupName: z.string(),
            optionName: z.string(),
            priceDelta: z.number().optional().default(0),
          })
        )
        .optional(),
    })
  ),
  payment: z.object({
    method: z.enum(["CASH_USD", "CASH_KHR", "DYNAMIC_QR", "CREDIT_CARD"]),
    amountUSD: z.number().min(0),
    amountKHR: z.number().optional(),
    changeGivenUSD: z.number().optional().default(0),
    changeGivenKHR: z.number().optional().default(0),
    transactionRef: z.string().optional(),
  }),
  tableNumber: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export class OrdersController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || "tenant-001";
      const storeId = req.storeId || "store-001";
      const validated = createOrderSchema.parse(req.body);

      const result = await ordersService.createOrder(tenantId, {
        ...validated,
        storeId: validated.storeId || storeId,
        cashierId: req.user?.userId,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = req.storeId || "store-001";
      const status = req.query.status as string | undefined;
      const orders = await ordersService.getOrders(storeId, status);
      return res.status(200).json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await ordersService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      return res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = updateStatusSchema.parse(req.body);
      const updated = await ordersService.updateOrderStatus(id, status);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
