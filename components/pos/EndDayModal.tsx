"use client";

import React, { useState } from "react";
import { Calendar, ShieldCheck, CheckCircle2, AlertTriangle, Lock, Printer } from "lucide-react";
import { ShiftState, HeldOrder } from "./types";
import { TouchKeypad, PinIndicatorDots } from "./TouchKeypad";

export interface EndDayModalProps {
  isOpen: boolean;
  shift: ShiftState | null;
  businessDate: string;
  heldOrders: HeldOrder[];
  onClose: () => void;
  onConfirmEndDay: () => void;
  onOpenHeldOrders: () => void;
}

export function EndDayModal({
  isOpen,
  shift,
  businessDate,
  heldOrders,
  onClose,
  onConfirmEndDay,
  onOpenHeldOrders,
}: EndDayModalProps) {
  const [endDayStep, setEndDayStep] = useState<"summary" | "pin" | "report">("summary");
  const [endDayPin, setEndDayPin] = useState<string>("");
  const [endDayPinError, setEndDayPinError] = useState<string>("");

  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* STEP 1: DAILY SUMMARY & RECONCILIATION */}
        {endDayStep === "summary" && (
          <div className="space-y-3.5">
            <div className="text-center border-b border-slate-100 pb-2.5">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 mb-1.5 shadow-xs">
                <Calendar size={22} />
              </div>
              <h2 className="text-base font-black text-slate-900">End Business Day · Z-Report</h2>
              <p className="text-xs font-semibold text-slate-400">
                Business Date:{" "}
                <span className="text-slate-800 font-bold">
                  {new Date(shift.businessDate || businessDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            {/* Day Shifts Status Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="font-bold text-slate-600">Daily Shifts Completed:</span>
                <span className="font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px]">
                  Shift #{shift.shiftNumber || 1} of 2 Active
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Cash Sales (USD):</span>
                <span className="font-bold text-slate-900">${shift.totalCashSalesUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total KHQR Digital Sales:</span>
                <span className="font-bold text-teal-700">${shift.totalQRSalesUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Orders Processed:</span>
                <span className="font-bold text-slate-900">{shift.orderCount} Orders</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 font-black text-slate-900">
                <span>Total Gross Daily Revenue:</span>
                <span className="text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ${(shift.totalCashSalesUSD + shift.totalQRSalesUSD).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Held Orders Warning */}
            {heldOrders.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-600 shrink-0" size={16} />
                  <span className="text-xs font-black text-rose-900">
                    Cannot End Day: {heldOrders.length} Order{heldOrders.length > 1 ? "s" : ""} on Hold
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenHeldOrders}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer"
                >
                  Resolve Held Orders ({heldOrders.length})
                </button>
              </div>
            )}

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
                onClick={() => setEndDayStep("pin")}
                className="flex-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Next: Supervisor Passcode →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SUPERVISOR AUTHORIZATION PIN */}
        {endDayStep === "pin" && (
          <div className="space-y-3.5">
            <div className="text-center border-b border-slate-100 pb-2">
              <ShieldCheck size={26} className="mx-auto text-rose-600 mb-1" />
              <h2 className="text-base font-black text-slate-900">Supervisor End-Day Passcode</h2>
              <p className="text-xs text-slate-400 mt-0.5">Authorize final day closing and date roll</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-center shadow-xs">
              <span className="text-xs font-black text-slate-700">Enter Supervisor PIN</span>
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEndDayStep("summary")}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={endDayPin.length < 4}
                onClick={() => {
                  if (endDayPin.length === 4) {
                    setEndDayStep("report");
                  } else {
                    setEndDayPinError("Please enter 4-digit supervisor PIN");
                  }
                }}
                className="flex-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <Lock size={14} className="inline mr-1.5" />
                Authorize &amp; Finalize Day
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL DAILY Z-REPORT & ROLL DATE */}
        {endDayStep === "report" && (
          <div className="space-y-3.5">
            <div className="text-center border-b border-slate-100 pb-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 mb-1">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-base font-black text-slate-900">Business Day Closed Successfully</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily Z-Report has been generated</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Closed Business Date:</span>
                <span className="font-bold text-slate-900">{businessDate}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Shifts Completed:</span>
                <span className="font-bold text-slate-900">2 Shifts</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Day Revenue:</span>
                <span className="font-black text-emerald-700">
                  ${(shift.totalCashSalesUSD + shift.totalQRSalesUSD).toFixed(2)} USD
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                🌅 Next register opening will start at <strong>Shift #1 (Morning Shift)</strong> for the next calendar day.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.print();
                  } catch {}
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Z-Report</span>
              </button>
              <button
                type="button"
                onClick={onConfirmEndDay}
                className="flex-2 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Close Day &amp; Exit Register →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
