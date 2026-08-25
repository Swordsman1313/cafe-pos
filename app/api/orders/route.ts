import { NextResponse } from "next/server";
import { OrdersService } from "@/modules/orders/orders.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || undefined;
  const status = searchParams.get("status") || undefined;
  const orders = await OrdersService.getOrders(storeId, status);
  return NextResponse.json({ success: true, count: orders.length, orders });
}
