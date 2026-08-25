"use client";

import React, { useState } from "react";
import { Send, Bot, Shield, CheckCircle2, AlertCircle, Sparkles, Store } from "lucide-react";

export default function SettingsAndTelegramBot() {
  const [botToken, setBotToken] = useState("7123456789:AAFxSampleTelegramBotTokenHere");
  const [chatId, setChatId] = useState("-1001987654321");
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyZReport, setNotifyZReport] = useState(true);
  const [notifySpillage, setNotifySpillage] = useState(true);
  const [khrRate, setKhrRate] = useState(4000);
  const [taxRate, setTaxRate] = useState(0.10);

  const [testingBot, setTestingBot] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestTelegram = async () => {
    setTestingBot(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, chatId }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult("✅ Test alert successfully dispatched! Check your Telegram channel/chat.");
      } else {
        setTestResult("⚠️ Telegram bot test simulated (Provide active bot token for live Telegram API).");
      }
    } catch (e: any) {
      setTestResult("⚠️ Telegram error: " + e.message);
    } finally {
      setTestingBot(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send size={20} className="text-amber-400" /> Telegram Real-Time Alert Bot (#5) & Store Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect your Telegram Bot for instant mobile push alerts on low stock breaches, shift Z-reports, and audit adjustments
        </p>
      </div>

      {testResult && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-300">
          <Sparkles size={16} className="shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Telegram Bot Config Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Telegram Push Alert Gateway</h3>
              <p className="text-[11px] text-slate-400">Direct notifications to owner and manager smartphones</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Bot Token</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="e.g. 7123456789:AAFx..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Obtained from @BotFather on Telegram</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Chat ID / Channel ID</label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="e.g. -1001987654321 or your user ID"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Alert Triggers</label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyLowStock}
                onChange={(e) => setNotifyLowStock(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 bg-slate-800 border-slate-700"
              />
              <span className="text-slate-300">🚨 Alert when raw ingredients breach low-stock thresholds</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyZReport}
                onChange={(e) => setNotifyZReport(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 bg-slate-800 border-slate-700"
              />
              <span className="text-slate-300">💰 Send instant Z-Report summary when a shift is closed</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifySpillage}
                onChange={(e) => setNotifySpillage(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 bg-slate-800 border-slate-700"
              />
              <span className="text-slate-300">⚠️ Notify owner of supervisor waste/spillage audit adjustments</span>
            </label>
          </div>

          <div className="pt-3">
            <button
              onClick={handleTestTelegram}
              disabled={testingBot}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition"
            >
              <Send size={14} className={testingBot ? "animate-spin" : ""} />
              {testingBot ? "Sending Test Alert..." : "Dispatch Test Telegram Alert"}
            </button>
          </div>
        </div>
      </div>

      {/* Global Financial Settings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Store size={16} className="text-amber-400" /> Currency & Tax Rates
        </h3>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">USD to KHR Rate</label>
            <input
              type="number"
              value={khrRate}
              onChange={(e) => setKhrRate(parseFloat(e.target.value) || 4000)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">VAT / Tax Rate (Decimal)</label>
            <input
              type="number"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0.10)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
