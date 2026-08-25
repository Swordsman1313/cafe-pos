import { NextResponse } from "next/server";
import { TelegramService } from "@/modules/telegram/telegram.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.botToken && body.chatId) {
      await TelegramService.saveTelegramConfig("tenant-001", body.botToken, body.chatId);
    }

    const result = await TelegramService.sendTelegramMessage(
      "tenant-001",
      `☕ *Café POS Alert Bot Connected!*\n\n` +
      `Instant alerts enabled for:\n` +
      `✅ Low-Stock Thresholds\n` +
      `✅ End-of-Day Z-Reports\n` +
      `✅ Waste/Spillage Audits\n\n` +
      `_Status: Live & Connected._`
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
