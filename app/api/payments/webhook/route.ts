import { NextResponse } from "next/server";
import { DynamicQRService } from "@/modules/payments/dynamic-qr.service";
import { OrdersService } from "@/modules/orders/orders.service";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "bakong-khqr-webhook-secret-2026";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    if (!DynamicQRService.verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      return NextResponse.json({ success: false, error: "Invalid HMAC signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    if (payload.orderId) {
      await OrdersService.updateStatus(payload.orderId, "PREPARING");
    }

    return NextResponse.json({ success: true, message: "Payment confirmed" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
