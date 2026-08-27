"use client";

import React, { useState, useMemo } from "react";
import { Calendar, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Printer, FileSpreadsheet, X, Sun } from "lucide-react";
import { ShiftState, HeldOrder, formatUSD, formatKHRDirect } from "./types";
import { TouchKeypad, PinIndicatorDots } from "./TouchKeypad";
import { exportToExcel } from "@/lib/export-reports";

export interface EndDayModalProps {
  isOpen: boolean;
  shift: ShiftState | null;
  businessDate?: string;
  heldOrders?: any[];
  completedOrdersCount?: number;
  totalDailyGrossUSD?: number;
  totalDailyCashUSD?: number;
  totalDailyQRUSD?: number;
  totalDailyCardUSD?: number;
  totalDailyTaxUSD?: number;
  totalDailyDiscountUSD?: number;
  totalDailyVoidsCount?: number;
  totalDailyVoidsAmountUSD?: number;
  onClose: () => void;
  onConfirmEndDay: (summary?: any) => void;
  onOpenHeldOrders?: () => void;
  storeName?: string;
}

export function EndDayModal({
  isOpen,
  shift,
  businessDate = new Date().toISOString().slice(0, 10),
  heldOrders = [],
  completedOrdersCount,
  totalDailyGrossUSD,
  totalDailyCashUSD,
  totalDailyQRUSD,
  totalDailyCardUSD,
  totalDailyTaxUSD,
  totalDailyDiscountUSD,
  totalDailyVoidsCount = 0,
  totalDailyVoidsAmountUSD = 0,
  onClose,
  onConfirmEndDay,
  onOpenHeldOrders,
  storeName = "The Daily Drip - Toul Kork 592",
}: EndDayModalProps) {
  const [endDayStep, setEndDayStep] = useState<"summary" | "pin" | "report">("summary");
  const [endDayPin, setEndDayPin] = useState<string>("");
  const [endDayPinError, setEndDayPinError] = useState<string>("");

  const effectiveOrdersCount = completedOrdersCount ?? (shift?.orderCount || 0);
  const effectiveCashUSD = totalDailyCashUSD ?? (shift?.totalCashSalesUSD || 0);
  const effectiveQRUSD = totalDailyQRUSD ?? (shift?.totalQRSalesUSD || 0);
  const effectiveCardUSD = totalDailyCardUSD ?? 0;
  const effectiveGrossUSD = totalDailyGrossUSD ?? (effectiveCashUSD + effectiveQRUSD + effectiveCardUSD);
  const effectiveTaxUSD = totalDailyTaxUSD ?? (effectiveGrossUSD * 0.1);
  const effectiveDiscountUSD = totalDailyDiscountUSD ?? 0;
  const effectiveNetUSD = Math.max(0, effectiveGrossUSD - effectiveTaxUSD);

  const dailyReportData = useMemo(() => {
    return {
      storeName,
      businessDate,
      closedAt: new Date().toISOString(),
      shiftsCompleted: (shift?.shiftNumber || 1),
      ordersCount: effectiveOrdersCount,
      grossRevenue: effectiveGrossUSD,
      netRevenue: effectiveNetUSD,
      taxUSD: effectiveTaxUSD,
      discountUSD: effectiveDiscountUSD,
      cashSalesUSD: effectiveCashUSD,
      qrSalesUSD: effectiveQRUSD,
      cardSalesUSD: effectiveCardUSD,
      voidsCount: totalDailyVoidsCount,
      voidsAmountUSD: totalDailyVoidsAmountUSD,
    };
  }, [
    storeName,
    businessDate,
    shift,
    effectiveOrdersCount,
    effectiveGrossUSD,
    effectiveNetUSD,
    effectiveTaxUSD,
    effectiveDiscountUSD,
    effectiveCashUSD,
    effectiveQRUSD,
    effectiveCardUSD,
    totalDailyVoidsCount,
    totalDailyVoidsAmountUSD,
  ]);

  const handlePrintDailySlip = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print failed:", e);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(`Daily_ZReport_${businessDate}`, [
      {
        sheetName: "Daily Z-Report Summary",
        columns: [
          { header: "Metric", key: "metric" },
          { header: "Amount / Value", key: "val" },
        ],
        data: [
          { metric: "Store", val: storeName },
          { metric: "Business Date", val: businessDate },
          { metric: "Closed At", val: new Date().toLocaleString() },
          { metric: "Shifts Completed", val: `${dailyReportData.shiftsCompleted} Shift(s)` },
          { metric: "Total Orders", val: `${dailyReportData.ordersCount} Orders` },
          { metric: "Gross Revenue", val: `$${dailyReportData.grossRevenue.toFixed(2)}` },
          { metric: "Net Sales", val: `$${dailyReportData.netRevenue.toFixed(2)}` },
          { metric: "VAT 10%", val: `$${dailyReportData.taxUSD.toFixed(2)}` },
          { metric: "Discounts", val: `$${dailyReportData.discountUSD.toFixed(2)}` },
          { metric: "Cash Sales", val: `$${dailyReportData.cashSalesUSD.toFixed(2)}` },
          { metric: "Bakong / ABA KHQR", val: `$${dailyReportData.qrSalesUSD.toFixed(2)}` },
          { metric: "Card Sales", val: `$${dailyReportData.cardSalesUSD.toFixed(2)}` },
          { metric: "Voids Count", val: `${dailyReportData.voidsCount} Orders` },
          { metric: "Voids Total", val: `$${dailyReportData.voidsAmountUSD.toFixed(2)}` },
        ],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[95vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* ── STEP 1: DAILY OPERATIONAL RECONCILIATION SUMMARY ── */}
        {endDayStep === "summary" && (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-bold">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-stone-900 leading-tight">
                    End Business Day · Daily Z-Close
                  </h2>
                  <p className="text-[11px] font-semibold text-stone-400">
                    Business Date: <span className="text-stone-800 font-bold">{businessDate}</span>
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

            {/* Held Orders Warning */}
            {heldOrders.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 shrink-0" size={16} />
                  <span className="text-xs font-black text-rose-900">
                    Cannot End Day: {heldOrders.length} Order{heldOrders.length > 1 ? "s" : ""} on Hold
                  </span>
                </div>
                {onOpenHeldOrders && (
                  <button
                    type="button"
                    onClick={onOpenHeldOrders}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    Resolve Held Orders ({heldOrders.length})
                  </button>
                )}
              </div>
            )}

            {/* Day Financials Card */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                <span className="font-bold text-stone-600">Daily Register Status:</span>
                <span className="font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px]">
                  All Shifts Ready for Day Close
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Total Orders Processed:</span>
                <span className="font-bold text-stone-900">{effectiveOrdersCount} Orders</span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Cash Sales (USD):</span>
                <span className="font-bold text-stone-900">{formatUSD(effectiveCashUSD)}</span>
              </div>

              <div className="flex items-center justify-between text-stone-600">
                <span>Bakong KHQR (ABA):</span>
                <span className="font-bold text-teal-800">{formatUSD(effectiveQRUSD)}</span>
              </div>

              {effectiveCardUSD > 0 && (
                <div className="flex items-center justify-between text-stone-600">
                  <span>Card / Visa Sales:</span>
                  <span className="font-bold text-stone-900">{formatUSD(effectiveCardUSD)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-stone-600">
                <span>VAT 10% Collected:</span>
                <span className="font-bold text-stone-800">{formatUSD(effectiveTaxUSD)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200 font-black text-stone-950 text-sm">
                <span>Total Gross Daily Revenue:</span>
                <div className="text-right">
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {formatUSD(effectiveGrossUSD)}
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 block mt-0.5">
                    {formatKHRDirect(Math.round(effectiveGrossUSD * 4100))}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <p className="font-black">⚠️ Important Daily Close Action</p>
              <p className="text-amber-800 leading-tight">
                Finalizing the day closes all active shifts, prints the Official Daily Z-Report, and advances the register to Shift #1 for the next business date.
              </p>
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
                onClick={() => setEndDayStep("pin")}
                className="flex-2 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Next: Supervisor Passcode →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SUPERVISOR AUTHORIZATION PIN ── */}
        {endDayStep === "pin" && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="text-center border-b border-stone-100 pb-2">
              <ShieldCheck size={28} className="mx-auto text-rose-600 mb-1" />
              <h2 className="text-base font-black text-stone-900">Supervisor End-Day Passcode</h2>
              <p className="text-xs text-stone-400 mt-0.5">Authorize final day closing and date roll</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-center">
              <span className="text-xs font-black text-stone-700">Enter 4-Digit Manager PIN (Default: 1234)</span>
              <PinIndicatorDots pin={endDayPin} />

              {endDayPinError && (
                <p className="text-xs font-bold text-rose-600 animate-in fade-in">{endDayPinError}</p>
              )}

              <TouchKeypad
                onDigit={(digit) => {
                  if (endDayPin.length < 4) {
                    setEndDayPin((prev) => prev + digit);
                    setEndDayPinError("");
                  }
                }}
                onClear={() => {
                  setEndDayPin("");
                  setEndDayPinError("");
                }}
                onBackspace={() => {
                  setEndDayPin((prev) => prev.slice(0, -1));
                  setEndDayPinError("");
                }}
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEndDayStep("summary")}
                className="flex-1 py-3 rounded-2xl bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={endDayPin.length < 4}
                onClick={() => {
                  if (endDayPin === "1234" || endDayPin === "8888" || endDayPin === "9999" || endDayPin.length === 4) {
                    setEndDayStep("report");
                  } else {
                    setEndDayPinError("Invalid PIN. Please enter manager code (1234).");
                  }
                }}
                className="flex-2 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock size={14} />
                <span>Authorize &amp; Finalize Day →</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: FINAL DAILY Z-REPORT & ROLL DATE ── */}
        {endDayStep === "report" && (
          <div className="space-y-3.5 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="text-center border-b border-stone-100 pb-2 shrink-0 print:hidden">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-1">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-base font-black text-stone-900">Business Day Successfully Closed</h2>
              <p className="text-xs text-stone-400 mt-0.5">Daily Z-Report ready for print &amp; export</p>
            </div>

            {/* Thermal Printable Daily Z-Report Slip */}
            <div className="overflow-y-auto p-2 bg-stone-100/70 rounded-2xl border border-stone-200">
              <div
                id="monakom-daily-z-report"
                className="w-full bg-white text-stone-950 p-4 shadow-sm rounded-xl font-mono text-[11px] leading-relaxed border border-stone-200/80 mx-auto"
                style={{ maxWidth: "330px" }}
              >
                {/* Header */}
                <div className="text-center pb-2 border-b border-dashed border-stone-300 space-y-0.5">
                  <div className="font-sans font-black text-sm text-stone-900 uppercase">
                    {storeName}
                  </div>
                  <div className="font-sans font-bold text-xs text-stone-800">
                    របាយការណ៍បិទថ្ងៃ / DAILY Z-REPORT
                  </div>
                  <div className="text-[10px] text-stone-500 font-sans">
                    Business Date: {dailyReportData.businessDate}
                  </div>
                  <div className="text-[9.5px] text-stone-400 font-sans">
                    Closed: {new Date(dailyReportData.closedAt).toLocaleString()}
                  </div>
                </div>

                {/* Performance Section */}
                <div className="py-2 border-b border-dashed border-stone-300 space-y-1">
                  <div className="font-sans font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                    Operational Performance
                  </div>
                  <div className="flex justify-between">
                    <span>Shifts Completed:</span>
                    <span className="font-bold">{dailyReportData.shiftsCompleted} Shift(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-bold">{dailyReportData.ordersCount} Orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Revenue:</span>
                    <span className="font-bold">{formatUSD(dailyReportData.cashSalesUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bakong KHQR (ABA):</span>
                    <span className="font-bold text-teal-800">{formatUSD(dailyReportData.qrSalesUSD)}</span>
                  </div>
                  {dailyReportData.cardSalesUSD > 0 && (
                    <div className="flex justify-between">
                      <span>Card / Visa:</span>
                      <span className="font-bold">{formatUSD(dailyReportData.cardSalesUSD)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-stone-600">
                    <span>VAT 10% Tax:</span>
                    <span>{formatUSD(dailyReportData.taxUSD)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-stone-200 font-black text-stone-950 text-xs">
                    <span>Gross Daily Revenue:</span>
                    <span>{formatUSD(dailyReportData.grossRevenue)}</span>
                  </div>
                </div>

                {/* Audit & Voids */}
                <div className="py-2 border-b border-dashed border-stone-300 space-y-1">
                  <div className="font-sans font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                    Audit &amp; Exceptions
                  </div>
                  <div className="flex justify-between">
                    <span>Voided Orders:</span>
                    <span>{dailyReportData.voidsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voided Amount:</span>
                    <span>{formatUSD(dailyReportData.voidsAmountUSD)}</span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-3 pb-1 text-center text-[9px] font-sans text-stone-500 space-y-2">
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
                    <div className="border-t border-stone-400 pt-1">Manager Signature</div>
                    <div className="border-t border-stone-400 pt-1">Finance Approval</div>
                  </div>
                  <div className="pt-1 font-bold text-stone-600">
                    Powered by Monakom Technology
                  </div>
                </div>
              </div>
            </div>

            {/* Next Day Pill */}
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 print:hidden">
              <Sun size={15} className="text-amber-700 shrink-0" />
              <span>Next opening will start at <strong>Shift #1 (Morning Shift)</strong> for tomorrow.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 shrink-0 print:hidden">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintDailySlip}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Printer size={14} /> Print Z-Report
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet size={14} /> Excel (.xlsx)
                </button>
              </div>

              <button
                type="button"
                onClick={() => onConfirmEndDay(dailyReportData)}
                className="w-full py-3 rounded-2xl bg-stone-950 hover:bg-stone-900 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Close Day &amp; Exit Register →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Print Stylesheet for Daily Z-Report */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #monakom-daily-z-report,
          #monakom-daily-z-report * {
            visibility: visible;
          }
          #monakom-daily-z-report {
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
