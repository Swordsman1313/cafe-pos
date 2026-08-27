"use client";

import React, { useEffect } from "react";
import {
  X,
  Clock,
  Flame,
  DollarSign,
  Ticket,
  Zap,
  Coffee,
  CreditCard,
  QrCode,
  Banknote,
  TrendingUp,
  Award,
} from "lucide-react";
import { HourlyBucket, DailyBucket } from "@/lib/analytics-aggregator";

interface HourlyBreakdownDrawerProps {
  bucket: HourlyBucket | DailyBucket | null;
  onClose: () => void;
  isLight?: boolean;
}

export default function HourlyBreakdownDrawer({
  bucket,
  onClose,
  isLight = false,
}: HourlyBreakdownDrawerProps) {
  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!bucket) return null;

  const totalRev = bucket.revenueUSD;
  const cashPct = totalRev > 0 ? Math.round((bucket.paymentSplit.cashUSD / totalRev) * 100) : 35;
  const khqrPct = totalRev > 0 ? Math.round((bucket.paymentSplit.khqrUSD / totalRev) * 100) : 55;
  const cardPct = totalRev > 0 ? Math.max(0, 100 - cashPct - khqrPct) : 10;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 ${
          isLight ? "bg-white text-slate-900 border-l border-slate-200" : "bg-slate-900 text-white border-l border-slate-800"
        }`}
      >
        {/* ── Top Header ── */}
        <div>
          <div className="flex items-center justify-between border-b pb-4 border-slate-200/60 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold flex items-center gap-1.5">
                    {bucket.windowTitle}
                  </h2>
                  <p className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Window Performance &amp; Item Breakdown
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Peak Banner if peak bucket */}
          {bucket.isPeak && (
            <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                <Flame size={16} className="fill-amber-400 animate-pulse" />
                <span>HIGHEST VOLUME WINDOW</span>
              </div>
              <span className="text-[10.5px] font-bold text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-md">
                {bucket.pctOfDaily}% of Total Sales
              </span>
            </div>
          )}

          {/* ── 4 Key Metrics ── */}
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Revenue</span>
              <span className="text-xl font-extrabold text-amber-500 block leading-tight">
                ${bucket.revenueUSD.toFixed(2)}
              </span>
              <span className={`text-[10px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {bucket.revenueKHR.toLocaleString()} ៛
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Order Volume</span>
              <span className={`text-xl font-extrabold block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                {bucket.orders} <span className="text-xs font-bold text-slate-400">tickets</span>
              </span>
              <span className={`text-[10px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Rate: {bucket.orderRatePerHour} ord/hr
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Avg Ticket</span>
              <span className={`text-xl font-extrabold block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                ${bucket.avgTicketUSD.toFixed(2)}
              </span>
              <span className={`text-[10px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                ≈ {(bucket.avgTicketUSD * 4100).toLocaleString()} ៛
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Ring-Up Speed</span>
              <span className="text-xl font-extrabold text-emerald-400 block leading-tight">
                {bucket.avgTransactionSpeedSec}s <span className="text-xs font-bold text-slate-400">/ ticket</span>
              </span>
              <span className={`text-[10px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {bucket.avgTransactionSpeedSec <= 40 ? "⚡ High Efficiency" : "Normal Flow"}
              </span>
            </div>
          </div>

          {/* ── Top-Selling Items in This Window ── */}
          <div className="space-y-2 mt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5 text-amber-500">
                <Coffee size={14} /> Top Drinks in This Window
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {bucket.topSellingItems.length} Products
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {bucket.topSellingItems.map((item, idx) => (
                <div
                  key={item.name}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                    isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-black text-amber-500 text-xs w-4">#{idx + 1}</span>
                    <div className="min-w-0">
                      <span className={`font-bold block truncate leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                        {item.name}
                      </span>
                      <span className={`text-[9.5px] font-medium ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-amber-400 block">${item.revenueUSD.toFixed(2)}</span>
                    <span className={`text-[9.5px] font-semibold block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {item.qty} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Method Split ── */}
          <div className="space-y-2 mt-5 border-t pt-4 border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-400" /> Payment Method Mix
              </span>
              <span className="text-[10px] font-bold text-slate-400">Total: ${bucket.revenueUSD.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5 pt-1">
              {/* Stacked Fill Bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-slate-800">
                <div style={{ width: `${khqrPct}%` }} className="h-full bg-emerald-500" title={`KHQR: ${khqrPct}%`} />
                <div style={{ width: `${cashPct}%` }} className="h-full bg-amber-500" title={`Cash: ${cashPct}%`} />
                <div style={{ width: `${cardPct}%` }} className="h-full bg-blue-500" title={`Card: ${cardPct}%`} />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-bold block">KHQR ({khqrPct}%)</span>
                    <span className="text-[9.5px] text-slate-400">${bucket.paymentSplit.khqrUSD.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Cash ({cashPct}%)</span>
                    <span className="text-[9.5px] text-slate-400">${bucket.paymentSplit.cashUSD.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Cards ({cardPct}%)</span>
                    <span className="text-[9.5px] text-slate-400">${bucket.paymentSplit.cardUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Drawer Close Button ── */}
        <div className="pt-4 border-t mt-4 border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Close Breakdown Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
