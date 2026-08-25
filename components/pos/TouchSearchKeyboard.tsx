"use client";

import React from "react";
import { Search, Delete, Check } from "lucide-react";

export function TouchSearchKeyboard({
  value,
  onChange,
  onClose,
  onClear,
}: {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const row1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const row2 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const row3 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const row4 = ["Z", "X", "C", "V", "B", "N", "M"];
  const quickTags = ["Latte", "Espresso", "Matcha", "Americano", "Croissant", "Cold Brew", "Cake"];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 p-3 sm:p-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
      <div className="max-w-2xl mx-auto space-y-2.5">
        {/* Top bar: Input preview + Quick Tags + Close button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Quick:</span>
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onChange(tag)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 border border-slate-700 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-black border border-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            ✕ Done
          </button>
        </div>

        {/* Live typed preview */}
        <div className="flex items-center justify-between bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Search size={15} className="text-amber-400 shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {value ? value : <span className="text-slate-500 font-normal">Type to search menu...</span>}
            </span>
          </div>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-950/50 border border-rose-800/50 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Keyboard Layout */}
        <div className="space-y-1.5 select-none">
          {/* Row 1: Numbers */}
          <div className="flex justify-center gap-1">
            {row1.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onChange(value + char)}
                className="flex-1 h-10 max-w-[58px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm shadow-xs border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Row 2: QWERTY */}
          <div className="flex justify-center gap-1">
            {row2.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onChange(value + char.toLowerCase())}
                className="flex-1 h-10 max-w-[58px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm shadow-xs border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Row 3: ASDF */}
          <div className="flex justify-center gap-1 px-3 sm:px-4">
            {row3.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onChange(value + char.toLowerCase())}
                className="flex-1 h-10 max-w-[58px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm shadow-xs border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
              >
                {char}
              </button>
            ))}
          </div>

          {/* Row 4: ZXCV + Backspace */}
          <div className="flex justify-center gap-1">
            {row4.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => onChange(value + char.toLowerCase())}
                className="flex-1 h-10 max-w-[58px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-sm shadow-xs border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
              >
                {char}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange(value.slice(0, -1))}
              className="flex-2 h-10 max-w-[90px] rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-amber-300 font-black text-sm shadow-xs border border-slate-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Delete size={16} />
              <span>⌫</span>
            </button>
          </div>

          {/* Row 5: Space + Done */}
          <div className="flex justify-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => onChange(value + " ")}
              className="flex-3 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs shadow-xs border border-slate-700 transition-all flex items-center justify-center cursor-pointer uppercase tracking-wider"
            >
              Space
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
