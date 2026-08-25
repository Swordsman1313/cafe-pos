import { NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await AuthService.loginWithPin(body.pin, body.storeId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
}
