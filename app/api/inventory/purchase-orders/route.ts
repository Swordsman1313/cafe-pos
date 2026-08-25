import { NextResponse } from "next/server";
import { SupplierPOService } from "@/modules/inventory/supplier-po.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || undefined;
  const list = await SupplierPOService.getPurchaseOrders(storeId);
  return NextResponse.json({ success: true, count: list.length, purchaseOrders: list });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await SupplierPOService.generateDraftPO({
      storeId: body.storeId || "store-bkk1",
      daysForecast: body.daysForecast || 7,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
