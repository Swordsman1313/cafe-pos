"use client";

import React, { useState } from "react";
import { X, Check, Delete, Tag, DollarSign, Percent, Lock, Banknote } from "lucide-react";
import { soundFX } from "@/lib/sound";

export interface TouchNumpadProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  mode: "PIN" | "DISCOUNT" | "CASH" | "QUANTITY" | "CUSTOM";
  initialValue?: string;
  maxValue?: number;
  totalUSD?: number;
  totalKHR?: number;
  onConfirm: (val: string, extra?: any) => void;
}

export function TouchNumpadDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  mode,
  initialValue = "",
  maxValue,
  totalUSD = 0,
  totalKHR = 0,
  onConfirm,
}: TouchNumpadProps) {
  const [value, setValue] = useState<string>(initialValue);
  const [discountType, setDiscountType] = useState<"PERCENT" | "USD">("PERCENT");
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    soundFX.playBlip(900);
    setPinError(null);
    if (mode === "PIN" && value.length >= 4) return;
    setValue((prev) => (prev === "0" ? digit : prev + digit));
  };

  const handleBackspace = () => {
    soundFX.playBlip(800);
    setPinError(null);
    setValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    soundFX.playBlip(600);
    setPinError(null);
    setValue("");
  };

  const handleDecimal = () => {
    soundFX.playBlip(900);
    if (!value.includes(".")) {
      setValue((prev) => (prev ? prev + "." : "0."));
    }
  };

  const handleDoubleZero = () => {
    soundFX.playBlip(900);
    if (value && value !== "0") {
      setValue((prev) => prev + "00");
    }
  };

  const handleConfirm = () => {
    if (mode === "PIN") {
      if (value === "1234" || value === "8888" || value === "9999") {
        soundFX.playSuccess();
        onConfirm(value);
        onClose();
      } else {
        soundFX.playWarning();
        setPinError("Invalid Manager PIN (Default: 1234)");
        setValue("");
      }
      return;
    }

    soundFX.playSuccess();
    onConfirm(value, { discountType, currency });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200 border border-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            {mode === "PIN" && <Lock size={18} className="text-amber-700" />}
            {mode === "DISCOUNT" && <Tag size={18} className="text-amber-700" />}
            {mode === "CASH" && <Banknote size={18} className="text-emerald-700" />}
            <div>
              <h2 className="text-sm font-black text-stone-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-[10px] text-stone-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode-Specific Presets */}
        {mode === "DISCOUNT" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Quick Presets</span>
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setDiscountType("PERCENT")}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    discountType === "PERCENT" ? "bg-white text-stone-900 font-black shadow-2xs" : "text-stone-500"
                  }`}
                >
                  % Percent
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("USD")}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    discountType === "USD" ? "bg-white text-stone-900 font-black shadow-2xs" : "text-stone-500"
                  }`}
                >
                  $ Dollar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(discountType === "PERCENT"
                ? [
                    { label: "10%", val: "10" },
                    { label: "15%", val: "15" },
                    { label: "20%", val: "20" },
                    { label: "50%", val: "50" },
                  ]
                : [
                    { label: "$0.50", val: "0.5" },
                    { label: "$1.00", val: "1.0" },
                    { label: "$2.00", val: "2.0" },
                    { label: "$5.00", val: "5.0" },
                  ]
              ).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setValue(chip.val)}
                  className="py-1.5 rounded-xl bg-stone-50 hover:bg-amber-50 border border-stone-200 text-xs font-black text-stone-800 text-center cursor-pointer transition-all active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "CASH" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Tender Currency</span>
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    currency === "USD" ? "bg-white text-emerald-800 font-black shadow-2xs" : "text-stone-500"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("KHR")}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    currency === "KHR" ? "bg-white text-emerald-800 font-black shadow-2xs" : "text-stone-500"
                  }`}
                >
                  KHR (៛)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {(currency === "USD"
                ? [
                    { label: "Exact", val: String(totalUSD) },
                    { label: "$5", val: "5" },
                    { label: "$10", val: "10" },
                    { label: "$20", val: "20" },
                  ]
                : [
                    { label: "Exact", val: String(totalKHR) },
                    { label: "10K ៛", val: "10000" },
                    { label: "20K ៛", val: "20000" },
                    { label: "50K ៛", val: "50000" },
                  ]
              ).map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setValue(chip.val)}
                  className="py-1.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 text-xs font-black text-stone-800 text-center cursor-pointer transition-all active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Readout Display */}
        {mode === "PIN" ? (
          <div className="py-2 text-center space-y-2">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full transition-all ${
                    i < value.length
                      ? "bg-amber-900 scale-110 ring-2 ring-amber-900/30"
                      : "bg-stone-100 border-2 border-stone-300"
                  }`}
                />
              ))}
            </div>
            {pinError ? (
              <p className="text-[11px] font-bold text-rose-600 animate-pulse">{pinError}</p>
            ) : (
              <p className="text-[10px] text-stone-400 font-medium">Enter 4-Digit Authorization Code (Default: 1234)</p>
            )}
          </div>
        ) : (
          <div className="h-12 px-4 rounded-2xl bg-stone-50 border-2 border-stone-200 flex items-center justify-between">
            <span className="text-xl font-black text-stone-900">
              {mode === "CASH"
                ? currency === "USD"
                  ? value ? `$${value}` : "$0.00"
                  : value ? `${Number(value).toLocaleString()} ៛` : "0 ៛"
                : mode === "DISCOUNT"
                ? discountType === "PERCENT"
                  ? value ? `${value} %` : "0 %"
                  : value ? `$${value}` : "$0.00"
                : value || "0"}
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* 100% Touch Numpad Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(String(n))}
              className="h-11 rounded-2xl bg-white hover:bg-stone-50 border-2 border-stone-200 text-base font-black text-stone-900 flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-black text-rose-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-11 rounded-2xl bg-white hover:bg-stone-50 border-2 border-stone-200 text-base font-black text-stone-900 flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            0
          </button>
          {mode === "PIN" ? (
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              <Delete size={18} />
            </button>
          ) : mode === "CASH" && currency === "KHR" ? (
            <button
              type="button"
              onClick={handleDoubleZero}
              className="h-11 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-sm font-black text-stone-900 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              00
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDecimal}
              className="h-11 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-base font-black text-stone-900 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              .
            </button>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={!value && mode !== "PIN"}
          onClick={handleConfirm}
          className="w-full py-3 rounded-2xl bg-[#4A2E1F] hover:bg-[#3d2417] disabled:opacity-40 text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Check size={16} />
          <span>Confirm & Authorize</span>
        </button>
      </div>
    </div>
  );
}
