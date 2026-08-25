"use client";

import React, { useState, useMemo } from "react";
import { Moon, ShieldCheck, CheckCircle2, Printer, Send, AlertTriangle } from "lucide-react";
import {
  ShiftState,
  HeldOrder,
  USD_DENOMS,
  KHR_DENOMS,
  KHR_RATE,
  formatUSD,
  formatKHR,
  formatKHRDirect,
} from "./types";
import { TouchKeypad, PinIndicatorDots } from "./TouchKeypad";

export interface EndShiftModalProps {
  isOpen: boolean;
  shift: ShiftState | null;
  heldOrders: HeldOrder[];
  onClose: () => void;
  onHandoverShift: () => void;
  onOpenHeldOrders: () => void;
  onToast: (toast: { method: string; amount: string }) => void;
}

export function EndShiftModal({
  isOpen,
  shift,
  heldOrders,
  onClose,
  onHandoverShift,
  onOpenHeldOrders,
  onToast,
}: EndShiftModalProps) {
  const [endShiftStep, setEndShiftStep] = useState<"count" | "pin" | "report">("count");
  const [endShiftPin, setEndShiftPin] = useState("");
  const [endShiftPinError, setEndShiftPinError] = useState("");

  const [closeUsdCounts, setCloseUsdCounts] = useState<Record<number, number>>({
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });
  const [closeKhrCounts, setCloseKhrCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    100: 0,
  });

  const totalCloseUSD = useMemo(
    () => USD_DENOMS.reduce((sum, d) => sum + d * (closeUsdCounts[d] || 0), 0),
    [closeUsdCounts]
  );
  const totalCloseKHR = useMemo(
    () => KHR_DENOMS.reduce((sum, d) => sum + d * (closeKhrCounts[d] || 0), 0),
    [closeKhrCounts]
  );
  const grandTotalCloseUSD = useMemo(
    () => totalCloseUSD + totalCloseKHR / KHR_RATE,
    [totalCloseUSD, totalCloseKHR]
  );

  const zReportData = useMemo(() => {
    if (!shift) return null;
    const expectedCashUSD = shift.floatUSD + shift.floatKHR / KHR_RATE + shift.totalCashSalesUSD;
    const actualUSD = grandTotalCloseUSD;
    const varianceUSD = actualUSD - expectedCashUSD;
    return {
      cashier: shift.cashierName,
      startedAt: shift.startedAt,
      closedAt: new Date().toISOString(),
      orderCount: shift.orderCount,
      floatUSD: shift.floatUSD,
      floatKHR: shift.floatKHR,
      cashSalesUSD: shift.totalCashSalesUSD,
      qrSalesUSD: shift.totalQRSalesUSD,
      grossSalesUSD: shift.totalCashSalesUSD + shift.totalQRSalesUSD,
      expectedCashUSD,
      actualDrawerUSD: actualUSD,
      varianceUSD,
    };
  }, [shift, grandTotalCloseUSD]);

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* STEP 1: COUNT DRAWER CASH */}
        {endShiftStep === "count" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                  <Moon size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    End Shift #{shift.shiftNumber || 1} of 2 · Cash Count
                  </h2>
                  <p className="text-xs font-semibold text-slate-400">
                    Cashier: <span className="text-slate-800 font-bold">{shift.cashierName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1 rounded-xl bg-slate-100 transition-colors cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            {/* Held Orders Warning */}
            {heldOrders.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-black text-rose-900">
                      Cannot End Shift: {heldOrders.length} Order{heldOrders.length > 1 ? "s" : ""} on Hold
                    </p>
                    <p className="text-[11px] text-rose-700">
                      All orders must be completed or cancelled before closing.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenHeldOrders}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                >
                  Resolve Held Orders ({heldOrders.length})
                </button>
              </div>
            )}

            {/* Summary Banner */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Drawer Counted:
                </span>
                <span className="text-sm font-black text-slate-900">
                  ${totalCloseUSD.toFixed(2)} USD + {formatKHRDirect(totalCloseKHR)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Combined</span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  ≈ ${grandTotalCloseUSD.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Zero-Scroll Denomination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* USD Denominations */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">USD Bills ($)</span>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    ${totalCloseUSD.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {USD_DENOMS.map((denom) => {
                    const count = closeUsdCounts[denom] || 0;
                    const sub = count * denom;
                    return (
                      <div
                        key={denom}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded-lg bg-white border border-slate-200/80 text-xs"
                      >
                        <span className="font-black text-xs text-slate-800 w-10">${denom}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCloseUsdCounts((prev) => ({ ...prev, [denom]: Math.max(0, (prev[denom] || 0) - 1) }))}
                            className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCloseUsdCounts((prev) => ({ ...prev, [denom]: (prev[denom] || 0) + 1 }))}
                            className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-right font-black text-xs text-slate-700 w-12">${sub.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KHR Denominations */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">KHR Bills (៛)</span>
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {formatKHRDirect(totalCloseKHR)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {KHR_DENOMS.map((denom) => {
                    const count = closeKhrCounts[denom] || 0;
                    const sub = count * denom;
                    return (
                      <div
                        key={denom}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded-lg bg-white border border-slate-200/80 text-xs"
                      >
                        <span className="font-black text-[11px] text-slate-800 w-16 truncate">
                          {formatKHRDirect(denom)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCloseKhrCounts((prev) => ({ ...prev, [denom]: Math.max(0, (prev[denom] || 0) - 1) }))}
                            className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCloseKhrCounts((prev) => ({ ...prev, [denom]: (prev[denom] || 0) + 1 }))}
                            className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-right font-black text-[11px] text-slate-700 w-16 truncate">
                          {formatKHRDirect(sub)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={heldOrders.length > 0}
                onClick={() => setEndShiftStep("pin")}
                className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                Next: Supervisor Passcode →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SUPERVISOR PIN APPROVAL */}
        {endShiftStep === "pin" && (
          <div className="space-y-3.5">
            <div className="text-center border-b border-slate-100 pb-2">
              <ShieldCheck size={26} className="mx-auto text-amber-600 mb-1" />
              <h2 className="text-base font-black text-slate-900">Supervisor Passcode Required</h2>
              <p className="text-xs text-slate-400 mt-0.5">Authorize drawer close for Shift #{shift.shiftNumber || 1}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-center shadow-xs">
              <span className="text-xs font-black text-slate-700">Enter Supervisor PIN</span>
              <PinIndicatorDots pin={endShiftPin} />

              {endShiftPinError && (
                <p className="text-xs font-bold text-rose-600 animate-in fade-in">{endShiftPinError}</p>
              )}

              <TouchKeypad
                onDigit={(digit) => {
                  if (endShiftPin.length < 4) {
                    setEndShiftPin((prev) => prev + digit);
                    setEndShiftPinError("");
                  }
                }}
                onClear={() => {
                  setEndShiftPin("");
                  setEndShiftPinError("");
                }}
                onBackspace={() => {
                  setEndShiftPin((prev) => prev.slice(0, -1));
                  setEndShiftPinError("");
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEndShiftStep("count")}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={endShiftPin.length < 4}
                onClick={() => {
                  if (endShiftPin.length === 4) {
                    setEndShiftStep("report");
                  } else {
                    setEndShiftPinError("Please enter 4-digit supervisor PIN");
                  }
                }}
                className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                Authorize &amp; View Report
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Z-REPORT RECONCILIATION SUMMARY */}
        {endShiftStep === "report" && zReportData && (
          <div className="space-y-3.5">
            <div className="text-center border-b border-slate-100 pb-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-1">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-base font-black text-slate-900">Shift #{shift.shiftNumber || 1} Closed Successfully</h2>
              <p className="text-xs text-slate-400 mt-0.5">Z-Report Summary</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Gross Revenue:</span>
                <span className="font-bold text-slate-900">{formatUSD(zReportData.grossSalesUSD)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cash Sales:</span>
                <span className="font-bold text-slate-900">{formatUSD(zReportData.cashSalesUSD)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>KHQR Digital:</span>
                <span className="font-bold text-teal-700">{formatUSD(zReportData.qrSalesUSD)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Drawer Cash:</span>
                <span className="font-bold text-slate-900">{formatUSD(zReportData.actualDrawerUSD)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
                <span>Cash Variance:</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    Math.abs(zReportData.varianceUSD) < 0.01
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {zReportData.varianceUSD >= 0 ? "+" : ""}
                  {formatUSD(zReportData.varianceUSD)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try { window.print(); } catch {}
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={13} /> Print
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/telegram/z-report", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        cashier: zReportData.cashier,
                        floatUSD: zReportData.floatUSD,
                        floatKHR: zReportData.floatKHR,
                        totalCashUSD: zReportData.cashSalesUSD,
                        totalQRUSD: zReportData.qrSalesUSD,
                        orderCount: zReportData.orderCount,
                        actualCashUSD: zReportData.actualDrawerUSD,
                        varianceUSD: zReportData.varianceUSD,
                        closedAt: new Date().toISOString(),
                      }),
                    });
                    const d = await res.json();
                    if (d.success) {
                      onToast({ method: "Telegram Bot", amount: "Z-Report Sent!" });
                    }
                  } catch {}
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <Send size={13} /> Telegram
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onHandoverShift}
                className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                🔄 Close Shift &amp; Prepare Next Shift →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
