import { NextResponse } from "next/server";
import { DynamicQRService } from "@/modules/payments/dynamic-qr.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const qrPayload = DynamicQRService.generateKHQRPayload(
      body.orderId || `ord-${Date.now()}`,
      body.amountUSD || 3.0,
      body.ticketNumber || "1154"
    );
    return NextResponse.json({ success: true, qrPayload, amountUSD: body.amountUSD });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
