"use client";

import React, { useState, useMemo } from "react";
import { Coffee, ShieldCheck, Lock } from "lucide-react";
import {
  StaffUser,
  ShiftState,
  STAFF_LIST,
  USD_DENOMS,
  KHR_DENOMS,
  KHR_RATE,
  formatKHRDirect,
} from "./types";
import { TouchKeypad, PinIndicatorDots } from "./TouchKeypad";

export interface OpenShiftModalProps {
  isOpen: boolean;
  businessDate: string;
  previousShiftNumber?: number;
  onOpenShift: (shift: ShiftState) => void;
}

export function OpenShiftModal({
  isOpen,
  businessDate,
  previousShiftNumber = 0,
  onOpenShift,
}: OpenShiftModalProps) {
  const [openShiftStep, setOpenShiftStep] = useState<"login" | "float" | "supervisor">("login");
  const [selectedStaff, setSelectedStaff] = useState<StaffUser>(STAFF_LIST[0]);
  const [cashierLoginPin, setCashierLoginPin] = useState<string>("");
  const [cashierPinError, setCashierPinError] = useState<string>("");

  const [supervisorOpenPin, setSupervisorOpenPin] = useState<string>("");
  const [supervisorPinError, setSupervisorPinError] = useState<string>("");

  const [openUsdCounts, setOpenUsdCounts] = useState<Record<number, number>>({
    100: 0,
    50: 0,
    20: 1,
    10: 2,
    5: 2,
    2: 0,
    1: 0,
  });
  const [openKhrCounts, setOpenKhrCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 2,
    20000: 3,
    10000: 4,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    100: 0,
  });

  const totalOpenUSD = useMemo(
    () => USD_DENOMS.reduce((sum, d) => sum + d * (openUsdCounts[d] || 0), 0),
    [openUsdCounts]
  );
  const totalOpenKHR = useMemo(
    () => KHR_DENOMS.reduce((sum, d) => sum + d * (openKhrCounts[d] || 0), 0),
    [openKhrCounts]
  );
  const grandTotalOpenUSD = useMemo(
    () => totalOpenUSD + totalOpenKHR / KHR_RATE,
    [totalOpenUSD, totalOpenKHR]
  );

  if (!isOpen) return null;

  const handleFinishOpen = () => {
    if (supervisorOpenPin.length < 4) {
      setSupervisorPinError("Please enter 4-digit supervisor PIN");
      return;
    }
    const currentBizDate = businessDate || new Date().toISOString().split("T")[0];
    const newShift: ShiftState = {
      isOpen: true,
      cashierName: `${selectedStaff.name} (${selectedStaff.role})`,
      startedAt: new Date().toISOString(),
      businessDate: currentBizDate,
      shiftNumber: previousShiftNumber + 1,
      floatUSD: totalOpenUSD,
      floatKHR: totalOpenKHR,
      totalCashSalesUSD: 0,
      totalQRSalesUSD: 0,
      orderCount: 0,
      ordersCompleted: [],
    };
    onOpenShift(newShift);
    setOpenShiftStep("login");
    setCashierLoginPin("");
    setSupervisorOpenPin("");
    setCashierPinError("");
    setSupervisorPinError("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* STEP 1: DIRECT CASHIER PASSCODE LOGIN */}
      {openShiftStep === "login" && (
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-1.5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <Coffee size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Artisan Roast Café</h1>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Enter 4-digit Cashier Passcode</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-center shadow-xs">
            <PinIndicatorDots pin={cashierLoginPin} />

            {cashierPinError && (
              <p className="text-xs font-bold text-rose-600 animate-in fade-in">{cashierPinError}</p>
            )}

            <TouchKeypad
              onDigit={(digit) => {
                if (cashierLoginPin.length < 4) {
                  const nextPin = cashierLoginPin + digit;
                  setCashierLoginPin(nextPin);
                  setCashierPinError("");
                  if (nextPin.length === 4) {
                    const matched = STAFF_LIST.find((s) => s.pin === nextPin) || {
                      id: "staff-1",
                      name: "Dara",
                      role: "Cashier",
                      pin: nextPin,
                      avatarBg: "bg-emerald-600",
                      avatarText: "DA",
                    };
                    setSelectedStaff(matched);
                    setTimeout(() => {
                      setOpenShiftStep("float");
                    }, 120);
                  }
                }
              }}
              onClear={() => {
                setCashierLoginPin("");
                setCashierPinError("");
              }}
              onBackspace={() => {
                setCashierLoginPin((prev) => prev.slice(0, -1));
                setCashierPinError("");
              }}
            />
          </div>

          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">
              Demo Cashier Passcode: <span className="font-bold text-slate-700">1234</span>
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: COUNT STARTING FLOAT (ZERO-SCROLL FIXED COMPACT LAYOUT) */}
      {openShiftStep === "float" && (
        <div className="w-full max-w-2xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Count Starting Cash Float</h2>
              <p className="text-xs font-semibold text-slate-400">
                Cashier: <span className="text-slate-800 font-bold">{selectedStaff.name} ({selectedStaff.role})</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpenShiftStep("login");
                setCashierLoginPin("");
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              🔒 Lock
            </button>
          </div>

          {/* Combined Float Summary Banner */}
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                Starting Float Total:
              </span>
              <span className="text-sm font-black text-slate-900">
                ${totalOpenUSD.toFixed(2)} USD + {formatKHRDirect(totalOpenKHR)} KHR
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">Combined Value</span>
              <span className="text-xs font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                ≈ ${grandTotalOpenUSD.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Denominations Grid (Strict Non-Scrolling Compact Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* USD Denominations (7 rows) */}
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">USD Bills ($)</span>
                <span className="text-xs font-black text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded">
                  ${totalOpenUSD.toFixed(2)}
                </span>
              </div>
              <div className="space-y-0.5">
                {USD_DENOMS.map((denom) => {
                  const count = openUsdCounts[denom] || 0;
                  const sub = denom * count;
                  return (
                    <div
                      key={denom}
                      className="flex items-center justify-between py-0.5 px-1.5 rounded-lg bg-white border border-slate-200/80 text-xs"
                    >
                      <span className="font-black text-xs text-slate-800 w-10">${denom}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setOpenUsdCounts((prev) => ({ ...prev, [denom]: Math.max(0, (prev[denom] || 0) - 1) }))}
                          className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenUsdCounts((prev) => ({ ...prev, [denom]: (prev[denom] || 0) + 1 }))}
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

            {/* KHR Denominations (9 rows) */}
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider">KHR Bills (៛)</span>
                <span className="text-xs font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded">
                  {formatKHRDirect(totalOpenKHR)}
                </span>
              </div>
              <div className="space-y-0.5">
                {KHR_DENOMS.map((denom) => {
                  const count = openKhrCounts[denom] || 0;
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
                          onClick={() => setOpenKhrCounts((prev) => ({ ...prev, [denom]: Math.max(0, (prev[denom] || 0) - 1) }))}
                          className="h-6 w-6 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-900">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOpenKhrCounts((prev) => ({ ...prev, [denom]: (prev[denom] || 0) + 1 }))}
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
              onClick={() => {
                setOpenShiftStep("login");
                setCashierLoginPin("");
              }}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setOpenShiftStep("supervisor")}
              className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              Next: Supervisor Authorization →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUPERVISOR PIN APPROVAL */}
      {openShiftStep === "supervisor" && (
        <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 shadow-xs mb-1">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Supervisor Authorization</h2>
            <p className="text-xs font-semibold text-slate-400">Enter supervisor passcode to open register</p>
          </div>

          {/* Summary Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 shadow-xs">
            <div className="flex justify-between text-slate-600">
              <span>Cashier On Duty:</span>
              <span className="font-bold text-slate-900">{selectedStaff.name} ({selectedStaff.role})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Starting Cash Float:</span>
              <span className="font-bold text-slate-900">
                ${totalOpenUSD.toFixed(2)} USD + {formatKHRDirect(totalOpenKHR)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
              <span>Combined Total Value:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ≈ ${grandTotalOpenUSD.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Supervisor PIN Keypad */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-center shadow-xs">
            <span className="text-xs font-black text-slate-700">Enter Supervisor 4-Digit PIN</span>
            <PinIndicatorDots pin={supervisorOpenPin} />

            {supervisorPinError && (
              <p className="text-xs font-bold text-rose-600 animate-in fade-in">{supervisorPinError}</p>
            )}

            <TouchKeypad
              onDigit={(digit) => {
                if (supervisorOpenPin.length < 4) {
                  const next = supervisorOpenPin + digit;
                  setSupervisorOpenPin(next);
                  setSupervisorPinError("");
                }
              }}
              onClear={() => {
                setSupervisorOpenPin("");
                setSupervisorPinError("");
              }}
              onBackspace={() => {
                setSupervisorOpenPin((prev) => prev.slice(0, -1));
                setSupervisorPinError("");
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpenShiftStep("float")}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={supervisorOpenPin.length < 4}
              onClick={handleFinishOpen}
              className="flex-2 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock size={14} />
              <span>Authorize &amp; Open Register</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
