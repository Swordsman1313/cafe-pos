import { NextResponse } from "next/server";
import { InventoryService } from "@/modules/inventory/inventory.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await InventoryService.adjustStock(body);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
