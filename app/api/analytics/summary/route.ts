import { NextResponse } from "next/server";
import { AnalyticsService } from "@/modules/analytics/analytics.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || undefined;
  const summary = await AnalyticsService.getExecutiveSummary(storeId);
  return NextResponse.json({ success: true, ...summary });
}
