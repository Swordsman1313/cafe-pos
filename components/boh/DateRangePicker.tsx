"use client";

import React, { useState } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Check,
  X,
} from "lucide-react";

export type DatePreset = "today" | "yesterday" | "7days" | "30days" | "custom";

export interface DateRangeState {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  label: string;
}

interface DateRangePickerProps {
  dateRange: DateRangeState;
  onChange: (range: DateRangeState) => void;
  onExportXLS: () => void;
  onExportPDF: () => void;
  isLight?: boolean;
}

export default function DateRangePicker({
  dateRange,
  onChange,
  onExportXLS,
  onExportPDF,
  isLight = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate);

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const presets: { id: DatePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
    { id: "custom", label: "Custom Range" },
  ];

  const handleSelectPreset = (p: DatePreset) => {
    let start = todayStr;
    let end = todayStr;
    let label = "Today";

    if (p === "today") {
      start = todayStr;
      end = todayStr;
      label = "Today";
    } else if (p === "yesterday") {
      start = yesterdayStr;
      end = yesterdayStr;
      label = "Yesterday";
    } else if (p === "7days") {
      start = sevenDaysAgoStr;
      end = todayStr;
      label = "Last 7 Days";
    } else if (p === "30days") {
      start = thirtyDaysAgoStr;
      end = todayStr;
      label = "Last 30 Days";
    } else if (p === "custom") {
      start = customStart || sevenDaysAgoStr;
      end = customEnd || todayStr;
      label = start === end ? start : `${start} to ${end}`;
    }

    onChange({
      preset: p,
      startDate: start,
      endDate: end,
      label,
    });

    if (p !== "custom") {
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) return;
    onChange({
      preset: "custom",
      startDate: customStart,
      endDate: customEnd,
      label: customStart === customEnd ? customStart : `${customStart} to ${customEnd}`,
    });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 relative">
      {/* ── Main Preset Dropdown / Pill Group ── */}
      <div
        className={`flex items-center p-1 rounded-2xl border transition-all ${
          isLight ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-900/90 border-slate-800"
        }`}
      >
        {presets.slice(0, 3).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelectPreset(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateRange.preset === p.id
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : isLight
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Custom / More Presets Popover Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateRange.preset === "30days" || dateRange.preset === "custom"
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : isLight
                ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CalendarDays size={13} />
            <span>{dateRange.preset === "custom" || dateRange.preset === "30days" ? dateRange.label : "More"}</span>
            <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Popover Card */}
          {isOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-72 p-4 rounded-3xl border shadow-2xl z-50 animate-in zoom-in-95 duration-150 ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-white"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-black flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-500" /> Select Date Range
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X size={13} />
                </button>
              </div>

              {/* All Presets List */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold text-left transition-all ${
                      dateRange.preset === p.id
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : isLight
                        ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="space-y-2 border-t pt-3 border-slate-200/60 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${
                      isLight
                        ? "bg-slate-50 border-slate-200 text-slate-900"
                        : "bg-slate-800 border-slate-700 text-white"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">End Date</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${
                      isLight
                        ? "bg-slate-50 border-slate-200 text-slate-900"
                        : "bg-slate-800 border-slate-700 text-white"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full mt-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Direct Automated Export Triggers for Active Window ── */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onExportXLS}
          title={`Export itemized spreadsheet for ${dateRange.label}`}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <FileSpreadsheet size={14} />
          <span className="hidden sm:inline">Export</span> XLS
        </button>

        <button
          type="button"
          onClick={onExportPDF}
          title={`Generate printable PDF executive audit report for ${dateRange.label}`}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2 px-3 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Printer size={14} className="text-amber-400" />
          <span className="hidden sm:inline">Print</span> PDF
        </button>
      </div>
    </div>
  );
}
