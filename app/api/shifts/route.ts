import { NextResponse } from "next/server";
import { ShiftsService } from "@/modules/shifts/shifts.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || undefined;
  const shifts = await ShiftsService.getShiftHistory(storeId);
  return NextResponse.json({ success: true, count: shifts.length, shifts });
}
