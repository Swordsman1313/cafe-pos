import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { dynamicQRService } from "./dynamic-qr.service.js";
import { escposService } from "../hardware/escpos.service.js";
import { ordersService } from "../orders/orders.service.js";
import { mockDb } from "../../db/prisma.js";

const generateQRSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  amount: z.number().positive(),
  currency: z.enum(["USD", "KHR"]).default("USD"),
  billNumber: z.string().optional(),
});

export class PaymentsController {
  async generateQR(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = generateQRSchema.parse(req.body);
      const result = dynamicQRService.generateDynamicQR(validated);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers["x-signature"] as string) || "";
      const rawBody = JSON.stringify(req.body);
      const result = await dynamicQRService.handlePaymentWebhook(rawBody, signature, req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPrintReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await ordersService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      const store = mockDb.stores.find((s) => s.id === order.storeId) || mockDb.stores[0];
      const printJob = escposService.generateCustomerReceipt(order, store);
      return res.status(200).json({ success: true, data: printJob });
    } catch (err) {
      next(err);
    }
  }

  async getPrintKitchenTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await ordersService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      const printJob = escposService.generateKitchenTicket(order);
      return res.status(200).json({ success: true, data: printJob });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
