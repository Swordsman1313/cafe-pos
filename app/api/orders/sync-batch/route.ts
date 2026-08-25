import { NextResponse } from "next/server";
import { OfflineSyncService } from "@/modules/orders/offline-sync.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await OfflineSyncService.syncBatch(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
