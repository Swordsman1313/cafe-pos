"use client";

import React from "react";

export function PinIndicatorDots({ pin, length = 4 }: { pin: string; length?: number }) {
  return (
    <div className="flex justify-center gap-3 my-2">
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < pin.length;
        return (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-150 ${
              isFilled
                ? "bg-slate-950 scale-110 shadow-xs ring-2 ring-slate-950/20"
                : "border-2 border-slate-300 bg-slate-100"
            }`}
          />
        );
      })}
    </div>
  );
}

export function TouchKeypad({
  onDigit,
  onClear,
  onBackspace,
  onQuickAdd,
}: {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onQuickAdd?: (amount: number) => void;
}) {
  return (
    <div className="space-y-2 select-none w-full max-w-[300px] mx-auto">
      {onQuickAdd && (
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onQuickAdd(1)}
            className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-800 border border-slate-200 transition-all shadow-2xs cursor-pointer"
          >
            +1 Bill
          </button>
          <button
            type="button"
            onClick={() => onQuickAdd(5)}
            className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-800 border border-slate-200 transition-all shadow-2xs cursor-pointer"
          >
            +5 Bills
          </button>
          <button
            type="button"
            onClick={() => onQuickAdd(10)}
            className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black text-slate-800 border border-slate-200 transition-all shadow-2xs cursor-pointer"
          >
            +10 Bills
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onDigit(String(num))}
            className="h-12 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-base font-black text-slate-900 border-2 border-slate-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-xs font-black text-rose-700 border-2 border-rose-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onDigit("0")}
          className="h-12 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-base font-black text-slate-900 border-2 border-slate-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-base font-black text-slate-700 border-2 border-slate-200 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
