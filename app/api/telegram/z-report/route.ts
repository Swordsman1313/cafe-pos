import { NextResponse } from "next/server";
import { TelegramService } from "@/modules/telegram/telegram.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cashier, floatUSD, floatKHR, totalCashUSD, totalQRUSD, totalCardUSD, orderCount, closedAt, actualCashUSD, varianceUSD } = body;

    const grossSalesUSD = (totalCashUSD || 0) + (totalQRUSD || 0) + (totalCardUSD || 0);
    const expectedCashUSD = (floatUSD || 0) + (totalCashUSD || 0);
    const varUSD = varianceUSD !== undefined ? varianceUSD : ((actualCashUSD || 0) - expectedCashUSD);

    let varianceStatus = "✅ Exact Match ($0.00)";
    if (varUSD > 0.01) {
      varianceStatus = `🟢 OVER (+$${varUSD.toFixed(2)} USD)`;
    } else if (varUSD < -0.01) {
      varianceStatus = `🔴 SHORT (-$${Math.abs(varUSD).toFixed(2)} USD)`;
    }

    const message =
      `☕ *ARTISAN ROAST CAFÉ — SHIFT Z-REPORT* ☕\n\n` +
      `👤 *Cashier On Duty:* ${cashier || "Cashier"}\n` +
      `🕒 *Closed At:* ${new Date(closedAt || Date.now()).toLocaleTimeString()}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *Total Orders:* \`${orderCount || 0}\` tickets\n` +
      `💵 *Gross Sales:* \`$${grossSalesUSD.toFixed(2)} USD\`\n` +
      `   ├ 💵 Cash: \`$${(totalCashUSD || 0).toFixed(2)}\`\n` +
      `   ├ 📱 ABA KHQR: \`$${(totalQRUSD || 0).toFixed(2)}\`\n` +
      `   └ 💳 Card: \`$${(totalCardUSD || 0).toFixed(2)}\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📥 *Starting Float:* \`$${(floatUSD || 0).toFixed(2)} USD\` + \`${(floatKHR || 0).toLocaleString()}៛\`\n` +
      `💰 *Expected Drawer:* \`$${expectedCashUSD.toFixed(2)} USD\`\n` +
      `📊 *Actual Counted:* \`$${(actualCashUSD || expectedCashUSD).toFixed(2)} USD\`\n` +
      `⚖️ *Cash Variance:* *${varianceStatus}*\n\n` +
      `✅ _Shift successfully reconciled and closed._`;

    const result = await TelegramService.sendTelegramMessage("tenant-001", message);
    return NextResponse.json({ success: true, result, preview: message });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
