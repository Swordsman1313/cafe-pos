import { NextResponse } from "next/server";
import { ShiftsService } from "@/modules/shifts/shifts.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || "store-bkk1";
  const shift = await ShiftsService.getCurrentShift(storeId);
  return NextResponse.json({ success: true, shift });
}
