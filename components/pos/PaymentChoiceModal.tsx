"use client";

import React, { useState, useMemo } from "react";
import {
  Banknote,
  QrCode,
  CreditCard,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Delete,
} from "lucide-react";
import { formatUSD, formatKHR, formatKHRDirect, KHR_RATE } from "./types";

export interface PaymentChoiceModalProps {
  totalUSD: number;
  onBack: () => void;
  onCompletePayment: (paymentDetails: {
    method: "CASH" | "KHQR" | "CREDIT";
    totalReceivedUSD: number;
    receivedUSD: string;
    receivedKHR: string;
    changeUSD: number;
    changeKHR: number;
    usdGiven: number;
    rielGiven: number;
  }) => void;
}

export function PaymentChoiceModal({
  totalUSD,
  onBack,
  onCompletePayment,
}: PaymentChoiceModalProps) {
  const [subMode, setSubMode] = useState<"choice" | "cash" | "khqr" | "credit">("choice");
  const [cashCurrency, setCashCurrency] = useState<"USD" | "KHR">("USD");

  const [receivedUSD, setReceivedUSD] = useState<string>("");
  const [receivedKHR, setReceivedKHR] = useState<string>("");

  const parsedUSD = parseFloat(receivedUSD) || 0;
  const parsedKHR = parseInt(receivedKHR, 10) || 0;
  const totalTenderedUSD = parsedUSD + parsedKHR / KHR_RATE;
  const diffUSD = totalTenderedUSD - totalUSD;
  const isExactOrOver = diffUSD >= -0.001;

  // Split Change
  const [usdGiven, setUsdGiven] = useState<number>(0);
  const totalChangeUSD = Math.max(0, diffUSD);
  const remainingChangeUSD = Math.max(0, totalChangeUSD - usdGiven);
  const rielGiven = Math.round(remainingChangeUSD * KHR_RATE);

  const totalKHR = Math.round(totalUSD * KHR_RATE);

  // Quick Chips
  const usdChips = useMemo(() => {
    const ceil1 = Math.ceil(totalUSD);
    const ceil5 = Math.ceil(totalUSD / 5) * 5;
    const ceil10 = Math.ceil(totalUSD / 10) * 10;
    const ceil20 = Math.ceil(totalUSD / 20) * 20;
    const set = new Set<number>();
    [ceil1, ceil5, ceil10, ceil20, 50, 100].forEach((v) => {
      if (v >= totalUSD && set.size < 4) set.add(v);
    });
    return Array.from(set);
  }, [totalUSD]);

  const khrChips = useMemo(() => {
    const chipValues = [10000, 20000, 50000, 100000];
    return chipValues.filter((v) => v >= totalKHR || v === 10000 || v === 20000);
  }, [totalKHR]);

  // Keypad Handlers
  const handleKeypadDigit = (digit: string) => {
    if (cashCurrency === "USD") {
      if (digit === "." && receivedUSD.includes(".")) return;
      if (receivedUSD.includes(".") && receivedUSD.split(".")[1].length >= 2) return;
      setReceivedUSD((prev) => prev + digit);
    } else {
      if (digit === ".") return;
      setReceivedKHR((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    if (cashCurrency === "USD") {
      setReceivedUSD((prev) => prev.slice(0, -1));
    } else {
      setReceivedKHR((prev) => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    if (cashCurrency === "USD") {
      setReceivedUSD("");
    } else {
      setReceivedKHR("");
    }
  };

  const handleExact = () => {
    if (cashCurrency === "USD") {
      setReceivedUSD(totalUSD.toFixed(2));
      setReceivedKHR("");
    } else {
      setReceivedKHR(String(totalKHR));
      setReceivedUSD("");
    }
  };

  const handleFinalizeCash = () => {
    if (!isExactOrOver) return;
    onCompletePayment({
      method: "CASH",
      totalReceivedUSD: totalTenderedUSD,
      receivedUSD,
      receivedKHR,
      changeUSD: usdGiven,
      changeKHR: rielGiven,
      usdGiven,
      rielGiven,
    });
  };

  return (
    <div className="space-y-2 animate-in fade-in duration-150">
      {/* CHOICE SCREEN: CASH or DIGITAL (KHQR / CREDIT) */}
      {subMode === "choice" && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Select Payment</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => setSubMode("cash")}
              className="group p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-200 hover:border-emerald-300 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Cash Payment</h3>
                  <p className="text-xs text-slate-500">USD ($) or Cambodian Riel (៛)</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setSubMode("khqr")}
              className="group p-4 rounded-2xl bg-teal-50 hover:bg-teal-100/80 border-2 border-teal-200 hover:border-teal-300 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bakong KHQR</h3>
                  <p className="text-xs text-slate-500">Scan to pay with any banking app</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-teal-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setSubMode("credit")}
              className="group p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border-2 border-indigo-200 hover:border-indigo-300 text-left transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Credit / Debit Card</h3>
                  <p className="text-xs text-slate-500">Manual POS terminal approval</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-indigo-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* CASH PAYMENT SCREEN */}
      {subMode === "cash" && (
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <button
              type="button"
              onClick={() => setSubMode("choice")}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCashCurrency("USD")}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  cashCurrency === "USD" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCashCurrency("KHR")}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  cashCurrency === "KHR" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                KHR (៛)
              </button>
            </div>
          </div>

          {/* Quick Money Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleExact}
              className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              Exact
            </button>
            {cashCurrency === "USD"
              ? usdChips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setReceivedUSD(String(val));
                      setReceivedKHR("");
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black transition-all cursor-pointer"
                  >
                    ${val}
                  </button>
                ))
              : khrChips.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setReceivedKHR(String(val));
                      setReceivedUSD("");
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-black transition-all cursor-pointer"
                  >
                    {val >= 1000 ? `${val / 1000}k ៛` : `${val} ៛`}
                  </button>
                ))}
          </div>

          {/* Tender & Change Breakdown */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between font-bold text-slate-600">
              <span>Total Due:</span>
              <span className="text-slate-900 font-black">{formatUSD(totalUSD)} ({formatKHR(totalUSD)})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tendered:</span>
              <span className="font-bold text-emerald-800">
                ${parsedUSD.toFixed(2)} + {formatKHRDirect(parsedKHR)} (≈ ${totalTenderedUSD.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-black">
              <span>{isExactOrOver ? "Change Return:" : "Due Left:"}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${isExactOrOver ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}>
                {isExactOrOver
                  ? `$${usdGiven.toFixed(2)} USD + ${formatKHRDirect(rielGiven)}`
                  : `$${Math.abs(diffUSD).toFixed(2)} USD (${formatKHR(Math.abs(diffUSD))})`}
              </span>
            </div>
          </div>

          {/* Touch Numpad for Cash Input */}
          <div className="space-y-1 select-none">
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeypadDigit(String(n))}
                  className="h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 transition-all flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadDigit(cashCurrency === "USD" ? "." : "0")}
                className="h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                {cashCurrency === "USD" ? "." : "0"}
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete size={16} />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!isExactOrOver}
            onClick={handleFinalizeCash}
            className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Complete Cash Sale</span>
          </button>
        </div>
      )}

      {/* KHQR DYNAMIC PAYMENT SCREEN */}
      {subMode === "khqr" && (
        <div className="space-y-3 text-center pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-left">
            <button
              type="button"
              onClick={() => setSubMode("choice")}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-xs font-black text-teal-800 uppercase tracking-wider">Bakong KHQR</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
            <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white p-2">
              {/* QR Mockup */}
              <div className="h-full w-full border-2 border-slate-900 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-50">
                <QrCode size={70} className="text-slate-900" />
                <span className="text-[9px] font-black text-slate-800 mt-1">KHQR PAY</span>
              </div>
            </div>
            <div>
              <span className="text-base font-black text-teal-400">{formatUSD(totalUSD)}</span>
              <span className="text-xs text-slate-400 block font-medium">({formatKHR(totalUSD)})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onCompletePayment({
                method: "KHQR",
                totalReceivedUSD: totalUSD,
                receivedUSD: totalUSD.toFixed(2),
                receivedKHR: "0",
                changeUSD: 0,
                changeKHR: 0,
                usdGiven: 0,
                rielGiven: 0,
              });
            }}
            className="w-full h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Simulate QR Success</span>
          </button>
        </div>
      )}

      {/* CREDIT CARD PAYMENT SCREEN */}
      {subMode === "credit" && (
        <div className="space-y-3 text-center pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-left">
            <button
              type="button"
              onClick={() => setSubMode("choice")}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-xs font-black text-indigo-800 uppercase tracking-wider">Credit Card</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <CreditCard size={18} />
              <span>Swipe / Tap on External POS Terminal</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Charge amount: <strong className="text-slate-900 font-black">{formatUSD(totalUSD)}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onCompletePayment({
                method: "CREDIT",
                totalReceivedUSD: totalUSD,
                receivedUSD: totalUSD.toFixed(2),
                receivedKHR: "0",
                changeUSD: 0,
                changeKHR: 0,
                usdGiven: 0,
                rielGiven: 0,
              });
            }}
            className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Approve Card Payment</span>
          </button>
        </div>
      )}
    </div>
  );
}
