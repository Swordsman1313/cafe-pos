import { db } from "@/lib/db";

export class TelegramService {
  /**
   * Dispatches a Telegram notification using Telegram Bot API
   */
  public static async sendTelegramMessage(tenantId: string, markdownMessage: string) {
    const config = db.telegramConfigs.find((c) => c.tenantId === tenantId);
    if (!config || !config.botToken || !config.chatId) {
      console.log("[Telegram] Bot not configured or disabled. Skipping message.");
      return { sent: false, reason: "NOT_CONFIGURED" };
    }

    try {
      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: markdownMessage,
          parse_mode: "Markdown",
        }),
      });

      const resJson = await response.json();
      return { sent: response.ok, response: resJson };
    } catch (err: any) {
      console.warn("[Telegram Bot] Notification error:", err.message);
      return { sent: false, error: err.message };
    }
  }

  public static async sendLowStockAlert(tenantId: string, alert: { name: string; currentStock: number; unit: string; reorderThreshold: number; storeName: string }) {
    const msg = `🚨 *LOW STOCK ALERT* 🚨\n\n` +
      `📍 *Store:* ${alert.storeName}\n` +
      `📦 *Item:* ${alert.name}\n` +
      `⚠️ *Current Stock:* \`${alert.currentStock} ${alert.unit}\`\n` +
      `🛑 *Reorder Threshold:* \`${alert.reorderThreshold} ${alert.unit}\`\n\n` +
      `_Automated Supplier PO recommended._`;

    return this.sendTelegramMessage(tenantId, msg);
  }

  public static async sendZReportSummary(tenantId: string, zReport: any) {
    const msg = `💰 *DAILY Z-REPORT CLOSED* 💰\n\n` +
      `📍 *Store:* ${zReport.store.name}\n` +
      `👤 *Cashier:* ${zReport.shift.cashier}\n` +
      `🧾 *Total Tickets:* \`${zReport.shift.orderCount}\`\n` +
      `💵 *Gross Sales:* \`$${zReport.salesBreakdown.grossSalesUSD}\`\n` +
      `💵 *Cash in Drawer:* \`$${zReport.cashSummary.actualCashUSD}\`\n` +
      `⚖️ *Cash Variance:* \`$${zReport.cashSummary.overShortUSD}\`\n\n` +
      `📅 _Closed: ${new Date(zReport.shift.closedAt).toLocaleTimeString()}_`;

    return this.sendTelegramMessage(tenantId, msg);
  }

  public static async sendAuditAlert(tenantId: string, audit: { type: string; ingredientName: string; quantity: number; unit: string; supervisorName: string; storeName: string; reason: string }) {
    const msg = `⚠️ *STOCK AUDIT / SPILLAGE LOGGED* ⚠️\n\n` +
      `📍 *Store:* ${audit.storeName}\n` +
      `👤 *Authorized By:* ${audit.supervisorName}\n` +
      `📦 *Item:* ${audit.ingredientName}\n` +
      `📉 *Quantity Adjusted:* \`-${audit.quantity} ${audit.unit}\`\n` +
      `📝 *Reason:* ${audit.reason}\n`;

    return this.sendTelegramMessage(tenantId, msg);
  }

  public static async saveTelegramConfig(tenantId: string, botToken: string, chatId: string) {
    let config = db.telegramConfigs.find((c) => c.tenantId === tenantId);
    if (!config) {
      config = { id: `tg-${Date.now()}`, tenantId, botToken, chatId, notifyLowStock: true, notifyZReport: true, notifySpillage: true };
      db.telegramConfigs.push(config);
    } else {
      config.botToken = botToken;
      config.chatId = chatId;
    }
    return config;
  }
}
