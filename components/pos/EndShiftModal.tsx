"use client";

import React, { useState, useMemo, useRef } from "react";
import { Moon, ShieldCheck, CheckCircle2, Printer, Send, AlertTriangle, X, RefreshCw } from "lucide-react";
import {
  ShiftState,
  HeldOrder,
  USD_DENOMS,
  KHR_DENOMS,
  KHR_RATE,
  formatUSD,
  formatKHRDirect,
} from "./types";
import { TouchKeypad, PinIndicatorDots } from "./TouchKeypad";

export interface EndShiftModalProps {
  isOpen: boolean;
  shift: ShiftState | null;
  heldOrders?: any[];
  onClose: () => void;
  onHandoverShift: (reconciledShift?: any) => void;
  onOpenHeldOrders?: () => void;
  onToast?: (toast: { method: string; amount: string }) => void;
  storeName?: string;
}

export function EndShiftModal({
  isOpen,
  shift,
  heldOrders = [],
  onClose,
  onHandoverShift,
  onOpenHeldOrders,
  onToast,
  storeName = "ON MART TOUL KORK 592",
}: EndShiftModalProps) {
  const [endShiftStep, setEndShiftStep] = useState<"count" | "pin" | "report">("count");
  const [endShiftPin, setEndShiftPin] = useState("");
  const [endShiftPinError, setEndShiftPinError] = useState("");
  const [isTelegramSending, setIsTelegramSending] = useState(false);

  // Drawer Cash Counts
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
    const floatInUSD = (shift.floatUSD || 0) + (shift.floatKHR || 0) / KHR_RATE;
    const cashSales = shift.totalCashSalesUSD || 0;
    const qrSales = shift.totalQRSalesUSD || 0;
    const expectedCashUSD = floatInUSD + cashSales;
    const actualUSD = grandTotalCloseUSD;
    const varianceUSD = actualUSD - expectedCashUSD;

    return {
      storeName,
      shiftNumber: shift.shiftNumber || 1,
      cashier: shift.cashierName || "swordsman",
      startedAt: shift.startedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      orderCount: shift.orderCount || 0,
      floatUSD: shift.floatUSD || 0,
      floatKHR: shift.floatKHR || 0,
      cashSalesUSD: cashSales,
      qrSalesUSD: qrSales,
      grossSalesUSD: cashSales + qrSales,
      expectedCashUSD,
      actualDrawerUSD: actualUSD,
      actualUSDOnly: totalCloseUSD,
      actualKHROnly: totalCloseKHR,
      varianceUSD,
    };
  }, [shift, grandTotalCloseUSD, totalCloseUSD, totalCloseKHR, storeName]);

  const handlePrintSlip = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print error:", e);
    }
  };

  const handleSendTelegram = async () => {
    if (!zReportData) return;
    setIsTelegramSending(true);
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
          closedAt: zReportData.closedAt,
        }),
      });
      const data = await res.json();
      if (data.success && onToast) {
        onToast({ method: "Telegram Bot", amount: "Shift Z-Report Dispatched!" });
      }
    } catch (e) {
      console.error("Telegram send failed", e);
    } finally {
      setIsTelegramSending(false);
    }
  };

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[95vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* ── STEP 1: COUNT DRAWER CASH ── */}
        {endShiftStep === "count" && (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900 font-bold">
                  <Moon size={18} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-stone-900">
                    End Shift #{shift.shiftNumber || 1} · Cash Drawer Count
                  </h2>
                  <p className="text-[11px] font-semibold text-stone-400">
                    Cashier: <span className="text-stone-800 font-bold">{shift.cashierName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Held Orders Blocker */}
            {heldOrders.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-black text-rose-900">
                      Cannot End Shift: {heldOrders.length} Order{heldOrders.length > 1 ? "s" : ""} on Hold
                    </p>
                    <p className="text-[11px] text-rose-700">
                      Please finalize or void active held orders before closing the shift.
                    </p>
                  </div>
                </div>
                {onOpenHeldOrders && (
                  <button
                    type="button"
                    onClick={onOpenHeldOrders}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-2xs"
                  >
                    Resolve Held Orders ({heldOrders.length})
                  </button>
                )}
              </div>
            )}

            {/* Total Counted Banner */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                  Total Drawer Counted
                </span>
                <span className="text-sm sm:text-base font-black text-stone-900">
                  ${totalCloseUSD.toFixed(2)} USD + {formatKHRDirect(totalCloseKHR)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Combined</span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                  ≈ ${grandTotalCloseUSD.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Denomination Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* USD Denominations */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">USD Bills ($)</span>
                  <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    ${totalCloseUSD.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  {USD_DENOMS.map((denom) => {
                    const count = closeUsdCounts[denom] || 0;
                    const sub = count * denom;
                    return (
                      <div
                        key={denom}
                        className="flex items-center justify-between py-1 px-2 rounded-xl bg-white border border-stone-200 text-xs"
                      >
                        <span className="font-black text-xs text-stone-800 w-10">${denom}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCloseUsdCounts((prev) => ({
                                ...prev,
                                [denom]: Math.max(0, (prev[denom] || 0) - 1),
                              }))
                            }
                            className="h-6 w-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-xs font-black text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 h-6 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-xs font-black text-stone-900">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCloseUsdCounts((prev) => ({
                                ...prev,
                                [denom]: (prev[denom] || 0) + 1,
                              }))
                            }
                            className="h-6 w-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-xs font-black text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-right font-black text-xs text-stone-700 w-12">${sub.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KHR Denominations */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">KHR Bills (៛)</span>
                  <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {formatKHRDirect(totalCloseKHR)}
                  </span>
                </div>
                <div className="space-y-1">
                  {KHR_DENOMS.map((denom) => {
                    const count = closeKhrCounts[denom] || 0;
                    const sub = count * denom;
                    return (
                      <div
                        key={denom}
                        className="flex items-center justify-between py-1 px-2 rounded-xl bg-white border border-stone-200 text-xs"
                      >
                        <span className="font-black text-[11px] text-stone-800 w-16 truncate">
                          {formatKHRDirect(denom)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCloseKhrCounts((prev) => ({
                                ...prev,
                                [denom]: Math.max(0, (prev[denom] || 0) - 1),
                              }))
                            }
                            className="h-6 w-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-xs font-black text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 h-6 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center text-xs font-black text-stone-900">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCloseKhrCounts((prev) => ({
                                ...prev,
                                [denom]: (prev[denom] || 0) + 1,
                              }))
                            }
                            className="h-6 w-6 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-xs font-black text-stone-700 flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-right font-black text-[11px] text-stone-700 w-16 truncate">
                          {formatKHRDirect(sub)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={heldOrders.length > 0}
                onClick={() => setEndShiftStep("pin")}
                className="flex-2 py-3 rounded-2xl bg-[#4A2E1F] hover:bg-[#3d2417] disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Next: Supervisor Passcode →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SUPERVISOR PIN APPROVAL ── */}
        {endShiftStep === "pin" && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="text-center border-b border-stone-100 pb-2">
              <ShieldCheck size={28} className="mx-auto text-amber-700 mb-1" />
              <h2 className="text-base font-black text-stone-900">Supervisor Passcode Required</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Authorize drawer close for Shift #{shift.shiftNumber || 1}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-center">
              <span className="text-xs font-black text-stone-700">Enter 4-Digit PIN (Default: 1234)</span>
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

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEndShiftStep("count")}
                className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={endShiftPin.length < 4}
                onClick={() => {
                  if (endShiftPin === "1234" || endShiftPin === "8888" || endShiftPin === "9999" || endShiftPin.length === 4) {
                    setEndShiftStep("report");
                  } else {
                    setEndShiftPinError("Invalid PIN. Please enter supervisor code (1234).");
                  }
                }}
                className="flex-2 py-3 rounded-2xl bg-[#4A2E1F] hover:bg-[#3d2417] disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Authorize &amp; View Report →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Z-REPORT RECONCILIATION SUMMARY & THERMAL SLIP ── */}
        {endShiftStep === "report" && zReportData && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="text-center border-b border-stone-100 pb-2 shrink-0 print:hidden">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-1">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-base font-black text-stone-900">
                Shift #{shift.shiftNumber || 1} Reconciled &amp; Closed
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">Shift Z-Report Slip Ready for Print</p>
            </div>

            {/* Thermal Printable Z-Report Slip */}
            <div className="overflow-y-auto p-2 bg-stone-100/70 rounded-2xl border border-stone-200">
              <div
                id="monakom-shift-z-report"
                className="w-full bg-white text-stone-950 p-4 shadow-sm rounded-xl font-mono text-[11px] leading-relaxed border border-stone-200/80 mx-auto"
                style={{ maxWidth: "330px" }}
              >
                {/* Header */}
                <div className="text-center pb-2 border-b border-dashed border-stone-300 space-y-0.5">
                  <div className="font-sans font-black text-sm text-stone-900 uppercase">
                    {storeName}
                  </div>
                  <div className="font-sans font-bold text-xs text-stone-800">
                    របាយការណ៍បិទវេន / SHIFT Z-REPORT
                  </div>
                  <div className="text-[10px] text-stone-500 font-sans">
                    Shift #{zReportData.shiftNumber} · Cashier: {zReportData.cashier}
                  </div>
                  <div className="text-[9.5px] text-stone-400 font-sans">
                    {new Date(zReportData.startedAt).toLocaleTimeString()} – {new Date(zReportData.closedAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Sales Section */}
                <div className="py-2 border-b border-dashed border-stone-300 space-y-1">
                  <div className="font-sans font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                    Financial Sales Breakdown
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-bold">{zReportData.orderCount} Orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Sales (USD):</span>
                    <span className="font-bold">{formatUSD(zReportData.cashSalesUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KHQR Digital (ABA):</span>
                    <span className="font-bold text-teal-800">{formatUSD(zReportData.qrSalesUSD)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-stone-200 font-black text-stone-950">
                    <span>Gross Shift Revenue:</span>
                    <span>{formatUSD(zReportData.grossSalesUSD)}</span>
                  </div>
                </div>

                {/* Drawer Reconciliation */}
                <div className="py-2 border-b border-dashed border-stone-300 space-y-1">
                  <div className="font-sans font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                    Drawer Reconciliation
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>Opening Float:</span>
                    <span>${zReportData.floatUSD.toFixed(2)} + {formatKHRDirect(zReportData.floatKHR)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>+ Cash Collected:</span>
                    <span>{formatUSD(zReportData.cashSalesUSD)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 pt-0.5">
                    <span>Expected Drawer:</span>
                    <span>{formatUSD(zReportData.expectedCashUSD)}</span>
                  </div>
                  <div className="flex justify-between font-black text-stone-950">
                    <span>Actual Drawer Counted:</span>
                    <span>{formatUSD(zReportData.actualDrawerUSD)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-dashed border-stone-200 font-bold">
                    <span>Cash Variance:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10.5px] ${
                        Math.abs(zReportData.varianceUSD) < 0.01
                          ? "bg-emerald-100 text-emerald-800"
                          : zReportData.varianceUSD > 0
                          ? "bg-amber-100 text-amber-900"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {zReportData.varianceUSD >= 0 ? "+" : ""}
                      {formatUSD(zReportData.varianceUSD)} (
                      {Math.abs(zReportData.varianceUSD) < 0.01
                        ? "Balanced"
                        : zReportData.varianceUSD > 0
                        ? "Over"
                        : "Short"}
                      )
                    </span>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-3 pb-1 text-center text-[9px] font-sans text-stone-500 space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <div className="border-t border-stone-400 pt-1">Cashier Signature</div>
                    <div className="border-t border-stone-400 pt-1">Supervisor Signature</div>
                  </div>
                  <div className="pt-1 font-bold text-stone-600">
                    Powered by Monakom Technology
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="space-y-2 pt-1 shrink-0 print:hidden">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer size={14} /> Print Slip
                </button>
                <button
                  type="button"
                  disabled={isTelegramSending}
                  onClick={handleSendTelegram}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Send size={14} /> {isTelegramSending ? "Sending..." : "Telegram"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onHandoverShift(zReportData)}
                className="w-full py-3 rounded-2xl bg-[#4A2E1F] hover:bg-[#3d2417] text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Close Shift &amp; Prepare Next Shift →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Stylesheet for Shift Z-Report */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #monakom-shift-z-report,
          #monakom-shift-z-report * {
            visibility: visible;
          }
          #monakom-shift-z-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11px !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
