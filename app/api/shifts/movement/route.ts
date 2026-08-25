import { NextResponse } from "next/server";
import { ShiftsService } from "@/modules/shifts/shifts.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const movement = await ShiftsService.recordCashMovement(body);
    return NextResponse.json({ success: true, movement });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
