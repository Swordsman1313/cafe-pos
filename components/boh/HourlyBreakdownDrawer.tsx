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
  Receipt,
  UserCheck,
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
  // Esc key listener for clean dismissal
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
    <>
      {/* ── Proper Scrim Backdrop Overlay (z-40) ── */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* ── Dedicated Right-Side Overlay Slide-Over Panel (z-50) ── */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${
          isLight
            ? "bg-white text-slate-900 border-l border-slate-200"
            : "bg-slate-900 text-white border-l border-slate-800"
        }`}
      >
        {/* ── 1. FIXED TOP HEADER (Pinned, never cut off or scrolled away) ── */}
        <div className="p-5 border-b shrink-0 flex items-center justify-between border-slate-200/60 dark:border-slate-800 bg-inherit">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold truncate leading-tight">
                {bucket.windowTitle}
              </h2>
              <p className={`text-[11px] font-medium mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Hourly Drill-Down, Receipts &amp; Prep Speed
              </p>
            </div>
          </div>

          {/* Distinct ✕ Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Drill-Down Panel"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shrink-0"
          >
            <X size={17} />
          </button>
        </div>

        {/* ── 2. SCROLLABLE DRAWER BODY ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Peak Banner if peak bucket */}
          {bucket.isPeak && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-black">
                <Flame size={16} className="fill-amber-500 animate-pulse" />
                <span>DAY'S HIGHEST PEAK VOLUME</span>
              </div>
              <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                {bucket.pctOfDaily}% of Total Sales
              </span>
            </div>
          )}

          {/* ── 4 Key Metric Summary Cards ── */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Revenue</span>
              <span className={`text-xl font-black block leading-tight ${isLight ? "text-slate-900" : "text-amber-400"}`}>
                ${bucket.revenueUSD.toFixed(2)}
              </span>
              <span className={`text-[10px] font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {bucket.revenueKHR.toLocaleString()} ៛
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Order Volume</span>
              <span className={`text-xl font-black block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                {bucket.orders} <span className="text-xs font-bold text-slate-400">tickets</span>
              </span>
              <span className={`text-[10px] font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Rate: {bucket.orderRatePerHour} ord/hr
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Avg Ticket</span>
              <span className={`text-xl font-black block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                ${bucket.avgTicketUSD.toFixed(2)}
              </span>
              <span className={`text-[10px] font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                ≈ {(bucket.avgTicketUSD * 4100).toLocaleString()} ៛
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/60 border-slate-700/60"}`}>
              <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-0.5">Avg Prep Speed</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                {bucket.avgTransactionSpeedSec}s <span className="text-xs font-bold text-slate-400">/ ticket</span>
              </span>
              <span className={`text-[10px] font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {bucket.avgTransactionSpeedSec <= 40 ? "⚡ Fast Flow" : "Normal Flow"}
              </span>
            </div>
          </div>

          {/* ── Top Items Sold in This Window ── */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Coffee size={14} /> Top Items Sold in This Hour
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Top {Math.min(bucket.topSellingItems.length, 3)}
              </span>
            </div>

            <div className="space-y-1.5">
              {bucket.topSellingItems.slice(0, 3).map((item, idx) => (
                <div
                  key={item.name}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/50 border-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-black text-amber-600 dark:text-amber-400 text-xs w-4">#{idx + 1}</span>
                    <div className="min-w-0">
                      <span className={`font-bold block truncate leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                        {item.name}
                      </span>
                      <span className={`text-[9.5px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-black block ${isLight ? "text-slate-900" : "text-amber-400"}`}>
                      ${item.revenueUSD.toFixed(2)}
                    </span>
                    <span className={`text-[9.5px] font-semibold block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {item.qty} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Method Split (KHQR vs Cash vs Card) ── */}
          <div className="space-y-2 border-t pt-3 border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5">
                <CreditCard size={14} className="text-blue-400" /> Payment Breakdown
              </span>
              <span className="text-[10px] font-bold text-slate-500">Total: ${bucket.revenueUSD.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5">
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
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400">${bucket.paymentSplit.khqrUSD.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Cash ({cashPct}%)</span>
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400">${bucket.paymentSplit.cashUSD.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <span className="font-bold block">Cards ({cardPct}%)</span>
                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400">${bucket.paymentSplit.cardUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Itemized Tickets List ── */}
          <div className="space-y-2 border-t pt-3 border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Receipt size={14} /> Individual Ticket Receipts
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {bucket.ticketsList?.length || 0} Tickets Logged
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(bucket.ticketsList || []).map((tix) => (
                <div
                  key={tix.ticketNumber}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isLight ? "bg-slate-50 border-slate-200/80" : "bg-slate-800/40 border-slate-700/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                        {tix.ticketNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {tix.time}
                      </span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                        tix.paymentMethod === "KHQR"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : tix.paymentMethod === "Cash"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                      }`}>
                        {tix.paymentMethod}
                      </span>
                    </div>
                    <p className={`text-[10.5px] font-medium truncate mt-0.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                      {tix.itemsSummary}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-black text-xs block ${isLight ? "text-slate-900" : "text-white"}`}>
                      ${tix.totalUSD.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">
                      by {tix.cashier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. FIXED BOTTOM ACTION (Pinned at bottom) ── */}
        <div className="p-4 border-t shrink-0 border-slate-200/60 dark:border-slate-800 bg-inherit">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Close Drill-Down Inspection
          </button>
        </div>
      </aside>
    </>
  );
}
