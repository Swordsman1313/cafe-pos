import { NextResponse } from "next/server";
import { ESCPOSService } from "@/modules/hardware/escpos.service";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "receipt";

    const order = db.orders.find((o) => o.id === id) || db.orders[0];
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const store = db.stores.find((s) => s.id === order.storeId) || db.stores[0];

    const buffer =
      type === "kot"
        ? ESCPOSService.generateKOTBuffer(order, "BARISTA")
        : ESCPOSService.generateReceiptBuffer(order, store);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${type}-${order.ticketNumber}.bin"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
