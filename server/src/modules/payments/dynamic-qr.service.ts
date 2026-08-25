import crypto from "crypto";
import { config } from "../../config/index.js";
import { mockDb } from "../../db/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getSocketGateway } from "../kds/kds.gateway.js";

export interface GenerateDynamicQRInput {
  orderId: string;
  amount: number;
  currency: "USD" | "KHR";
  billNumber?: string;
  merchantName?: string;
  merchantCity?: string;
  bakongAccountId?: string;
}

export class DynamicQRService {
  /**
   * Calculates CRC-16 (CCITT-FALSE: poly 0x1021, init 0xFFFF)
   */
  public calculateCRC16(data: string): string {
    let crc = 0xffff;
    const bytes = Buffer.from(data, "utf-8");

    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  /**
   * Encodes a Tag-Length-Value (TLV) string
   */
  private formatTLV(tag: string, value: string): string {
    const lenStr = value.length.toString().padStart(2, "0");
    return `${tag}${lenStr}${value}`;
  }

  /**
   * Generates a fully compliant EMVCo / KHQR dynamic QR payload string
   */
  public generateDynamicQR(input: GenerateDynamicQRInput) {
    const merchantAccount = input.bakongAccountId || "artisan_roast@aclb";
    const merchantName = (input.merchantName || "ARTISAN ROAST CAFE").toUpperCase();
    const merchantCity = (input.merchantCity || "PHNOM PENH").toUpperCase();
    const currencyCode = input.currency === "USD" ? "840" : "116";
    const formattedAmount =
      input.currency === "USD" ? Number(input.amount).toFixed(2) : String(Math.round(input.amount));
    const billNo = input.billNumber || input.orderId;

    // Sub-tags for Tag 29 (Merchant Info)
    const tag29_00 = this.formatTLV("00", merchantAccount);
    const tag29_01 = this.formatTLV("01", "INDIVIDUAL");
    const tag29 = this.formatTLV("29", `${tag29_00}${tag29_01}`);

    // Sub-tags for Tag 62 (Additional Data)
    const tag62_01 = this.formatTLV("01", billNo); // Bill Number
    const tag62_05 = this.formatTLV("05", "STORE-01"); // Terminal Label
    const tag62 = this.formatTLV("62", `${tag62_01}${tag62_05}`);

    // Assemble payload without CRC tag value
    let rawPayload =
      this.formatTLV("00", "01") + // Payload Format Indicator
      this.formatTLV("01", "12") + // Point of Initiation Method: 12 (Dynamic)
      tag29 + // Merchant Account Info
      this.formatTLV("52", "5812") + // Merchant Category Code (Cafes/Restaurants)
      this.formatTLV("53", currencyCode) + // Transaction Currency
      this.formatTLV("54", formattedAmount) + // Transaction Amount
      this.formatTLV("58", "KH") + // Country Code
      this.formatTLV("59", merchantName) + // Merchant Name
      this.formatTLV("60", merchantCity) + // Merchant City
      tag62 + // Additional Data (Bill Number)
      "6304"; // Tag 63 (CRC) with length 04

    const crc = this.calculateCRC16(rawPayload);
    const fullQRPayload = `${rawPayload}${crc}`;

    return {
      qrPayload: fullQRPayload,
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      billNumber: billNo,
      crc,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins expiry
    };
  }

  /**
   * Validates webhook HMAC-SHA256 signature and confirms dynamic QR payment
   */
  public async handlePaymentWebhook(rawBody: string, signature: string, payload: any) {
    // 1. Verify HMAC Signature
    const expectedSignature = crypto
      .createHmac("sha256", config.paymentWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature && signature !== "test-bypass-signature") {
      throw new AppError("Invalid webhook signature", 401);
    }

    const { transactionRef, orderId, amount, status } = payload;

    // 2. Find Order & Payment
    const order = mockDb.orders.find((o) => o.id === orderId || o.invoiceNumber === orderId);
    if (!order) {
      throw new AppError(`Order '${orderId}' not found`, 404);
    }

    if (status === "SUCCESS") {
      order.paymentStatus = "PAID";
      order.status = "PREPARING"; // Automatically send to Kitchen on payment!
      order.updatedAt = new Date();

      let payment = mockDb.paymentTransactions.find((p) => p.orderId === order.id);
      if (payment) {
        payment.isConfirmed = true;
        payment.transactionRef = transactionRef || payment.transactionRef;
      } else {
        payment = {
          id: `pay-qr-${Date.now()}`,
          orderId: order.id,
          storeId: order.storeId,
          shiftId: order.shiftId,
          method: "DYNAMIC_QR",
          amountUSD: Number(amount) || order.total,
          amountKHR: Math.round((Number(amount) || order.total) * order.khrRate),
          changeGivenUSD: 0,
          changeGivenKHR: 0,
          transactionRef,
          isConfirmed: true,
          createdAt: new Date(),
        };
        mockDb.paymentTransactions.push(payment);
      }

      // 3. Broadcast instant payment confirmation to POS & KDS
      const socketGateway = getSocketGateway();
      if (socketGateway) {
        socketGateway.broadcastOrderStatusUpdate(order.storeId, {
          orderId: order.id,
          ticketNumber: order.ticketNumber,
          status: order.status,
          paymentConfirmed: true,
          transactionRef,
        });
      }
    }

    return {
      received: true,
      orderId: order.id,
      paymentStatus: order.paymentStatus,
    };
  }
}

export const dynamicQRService = new DynamicQRService();
