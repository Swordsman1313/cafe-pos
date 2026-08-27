"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  DollarSign,
  Ticket,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Calendar,
} from "lucide-react";
import { HourlyBucket, DailyBucket } from "@/lib/analytics-aggregator";

export type ChartMetric = "USD" | "KHR" | "TICKETS" | "RATE";
export type ChartStyle = "bar" | "line";

interface HourlySalesChartProps {
  data: HourlyBucket[];
  dailyData?: DailyBucket[];
  isWeeklyView?: boolean;
  isLight?: boolean;
  khrRate?: number;
  onSelectHour?: (bucket: HourlyBucket | DailyBucket) => void;
}

export default function HourlySalesChart({
  data,
  dailyData = [],
  isWeeklyView = false,
  isLight = false,
  khrRate = 4100,
  onSelectHour,
}: HourlySalesChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("USD");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("bar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  // Active dataset: Hourly or 7-Day Daily
  const activeDataset: Array<HourlyBucket | DailyBucket> = isWeeklyView && dailyData.length > 0 ? dailyData : data;

  // Helper to extract value based on selected metric
  const getValue = (bucket: HourlyBucket | DailyBucket): number => {
    switch (metric) {
      case "USD":
        return bucket.revenueUSD;
      case "KHR":
        return bucket.revenueKHR;
      case "TICKETS":
        return bucket.orders;
      case "RATE":
        return bucket.orderRatePerHour;
    }
  };

  // Helper to format values for display
  const formatValue = (val: number, isShort = false): string => {
    switch (metric) {
      case "USD":
        return isShort ? `$${val.toFixed(0)}` : `$${val.toFixed(2)}`;
      case "KHR":
        return isShort
          ? `${Math.round(val / 1000)}k ៛`
          : `${val.toLocaleString()} ៛`;
      case "TICKETS":
        return isShort ? `${val}` : `${val} tickets`;
      case "RATE":
        return isShort ? `${val}/h` : `${val} ord/hr`;
    }
  };

  // Calculate dynamic max value for scaling
  const maxValue = useMemo(() => {
    const vals = activeDataset.map((d) => getValue(d));
    const max = Math.max(...vals, 1);
    return max;
  }, [activeDataset, metric]);

  // Peak bucket identification
  const peakBucket = useMemo(() => {
    return [...activeDataset].sort((a, b) => getValue(b) - getValue(a))[0] || activeDataset[0];
  }, [activeDataset, metric]);

  const totalRevenueUSD = useMemo(() => activeDataset.reduce((s, d) => s + d.revenueUSD, 0), [activeDataset]);
  const totalOrders = useMemo(() => activeDataset.reduce((s, d) => s + d.orders, 0), [activeDataset]);

  // Generate SVG path for Line / Area Wave View
  const wavePath = useMemo(() => {
    if (activeDataset.length === 0) return { area: "", line: "", points: [] };
    const width = 800;
    const height = 150;
    const paddingX = 25;
    const paddingY = 20;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const points = activeDataset.map((d, i) => {
      const val = getValue(d);
      const x = paddingX + (i / (activeDataset.length - 1)) * chartW;
      const y = height - paddingY - (val / Math.max(maxValue, 1)) * chartH;
      return { x, y, bucket: d };
    });

    const lineCommands = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      return `${acc} C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
    }, "");

    const first = points[0];
    const last = points[points.length - 1];
    const areaCommands = `${lineCommands} L ${last.x},${height - paddingY} L ${first.x},${height - paddingY} Z`;

    return { area: areaCommands, line: lineCommands, points };
  }, [activeDataset, metric, maxValue]);

  const hoveredBucket = hoveredIndex !== null ? activeDataset[hoveredIndex] : null;

  const handleBarClick = (bucket: HourlyBucket | DailyBucket, idx: number) => {
    setSelectedBarIndex(idx);
    onSelectHour?.(bucket);
  };

  return (
    <div
      onMouseLeave={() => setHoveredIndex(null)}
      className={`rounded-3xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between max-w-full ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Top Header Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              {isWeeklyView ? <Calendar size={16} /> : <BarChart3 size={16} />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                {isWeeklyView ? "7-Day Revenue & Daily Volume" : "Hourly Velocity & Rush Architecture"}
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Flame size={10} className="fill-amber-500" /> Peak {peakBucket.label}
                </span>
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {isWeeklyView
                  ? "Daily revenue & total tickets across the 7-day window"
                  : "Click any hour column for granular item breakdown & ring-up speed"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Metric & View Toggles ── */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* 4 Independent Metric Views */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-[10px] font-black ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/80 border-slate-700"
            }`}
          >
            {(
              [
                { id: "USD", label: "USD ($)" },
                { id: "KHR", label: "KHR (៛)" },
                { id: "TICKETS", label: "Tickets (#)" },
                { id: "RATE", label: isWeeklyView ? "Avg Ord/Hr" : "Rate (Ord/Hr)" },
              ] as { id: ChartMetric; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  metric === m.id
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-xs"
                    : isLight
                    ? "text-slate-500 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Visualization: Bar vs Line */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-[10px] font-black ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/80 border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => setChartStyle("bar")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                chartStyle === "bar"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bars
            </button>
            <button
              type="button"
              onClick={() => setChartStyle("line")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                chartStyle === "line"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Line Curve
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Hover / Callout (Cleaned up state to prevent ghost tooltips) ── */}
      <div
        className={`mb-3 px-3 py-2 rounded-2xl border flex items-center justify-between text-xs transition-all ${
          isLight
            ? "bg-amber-50/80 border-amber-200/80 text-slate-900"
            : "bg-slate-800/60 border-slate-700/60 text-slate-200"
        }`}
      >
        {hoveredBucket ? (
          <>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold">{hoveredBucket.windowTitle || hoveredBucket.label}:</span>
              <span className="font-black text-amber-600 dark:text-amber-400">
                {formatValue(getValue(hoveredBucket))}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                (${hoveredBucket.revenueUSD.toFixed(2)} · {hoveredBucket.orders} tix)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span>Speed: {hoveredBucket.avgTransactionSpeedSec}s</span>
              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">
                {hoveredBucket.pctOfDaily}% Mix
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" /> Click any column to open itemized sales &amp; speed drawer
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {isWeeklyView ? "7-Day Total:" : "Today Total:"} ${totalRevenueUSD.toFixed(2)} · {totalOrders} Orders
            </span>
          </div>
        )}
      </div>

      {/* ── Chart Canvas ── */}
      <div
        className="relative w-full"
        style={{ minHeight: "175px" }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {chartStyle === "bar" ? (
          /* ── 1. Column Bars View ── */
          <div className="flex items-end gap-1 sm:gap-2 h-44 w-full pt-4 pb-2">
            {activeDataset.map((bucket, idx) => {
              const val = getValue(bucket);
              const heightPct = Math.max(6, Math.round((val / Math.max(maxValue, 1)) * 100));
              const isPeak = bucket.label === peakBucket.label;
              const isHovered = hoveredIndex === idx;
              const isSelected = selectedBarIndex === idx;

              return (
                <div
                  key={bucket.label + idx}
                  onClick={() => handleBarClick(bucket, idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex flex-col items-center flex-1 h-full justify-end group cursor-pointer transition-all relative min-w-0 ${
                    isSelected ? "scale-[1.02]" : ""
                  }`}
                >
                  {/* Peak Flame */}
                  {isPeak && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 animate-bounce">
                      <Flame size={12} className="text-amber-500 fill-amber-500 drop-shadow-md" />
                    </div>
                  )}

                  {/* Value Label on Top */}
                  <span
                    className={`text-[8.5px] font-bold mb-1 transition-all truncate max-w-full ${
                      isSelected || isHovered || isPeak
                        ? "text-amber-600 dark:text-amber-400 font-extrabold scale-110"
                        : isLight
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {formatValue(val, true)}
                  </span>

                  {/* Bar Track */}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-t from-amber-500 to-amber-300 ring-2 ring-amber-400 shadow-lg shadow-amber-500/50"
                          : isPeak
                          ? "bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-lg shadow-amber-500/40 ring-1 ring-amber-300"
                          : isHovered
                          ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-500/20"
                          : isLight
                          ? "bg-gradient-to-t from-amber-700/60 to-amber-500/40 group-hover:from-amber-600 group-hover:to-amber-400"
                          : "bg-gradient-to-t from-slate-700/90 to-amber-600/50 group-hover:from-amber-600 group-hover:to-amber-400"
                      }`}
                    />
                  </div>

                  {/* X-Axis Day / Hour Label */}
                  <span
                    className={`text-[9.5px] mt-1.5 font-bold transition-colors truncate max-w-full ${
                      isSelected
                        ? "text-amber-600 dark:text-amber-400 font-black underline underline-offset-2"
                        : isPeak
                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                        : isHovered
                        ? isLight
                          ? "text-slate-900"
                          : "text-white"
                        : isLight
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {bucket.label.replace(" ", "")}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 2. Smooth Bézier Line Wave View ── */
          <div className="w-full h-44 pt-2 pb-2 flex flex-col justify-between">
            <svg viewBox="0 0 800 150" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lineAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#D97706" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FDE68A" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="25" y1="20" x2="775" y2="20" stroke={isLight ? "#E2E8F0" : "#334155"} strokeDasharray="3 3" />
              <line x1="25" y1="75" x2="775" y2="75" stroke={isLight ? "#E2E8F0" : "#334155"} strokeDasharray="3 3" />
              <line x1="25" y1="130" x2="775" y2="130" stroke={isLight ? "#CBD5E1" : "#475569"} />

              {/* Gradient Filled Area */}
              <path d={wavePath.area} fill="url(#lineAreaGradient)" />

              {/* Stroke Line */}
              <path
                d={wavePath.line}
                fill="none"
                stroke="url(#lineStrokeGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {wavePath.points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                const isSelected = selectedBarIndex === idx;
                const isPeak = p.bucket.label === peakBucket.label;

                return (
                  <g
                    key={idx}
                    onClick={() => handleBarClick(p.bucket, idx)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 8 : isPeak ? 7 : isHovered ? 6 : 4}
                      className={`transition-all ${
                        isSelected
                          ? "fill-white stroke-amber-400 stroke-3 drop-shadow-lg"
                          : isPeak
                          ? "fill-amber-300 stroke-amber-600 stroke-2 drop-shadow-md"
                          : isHovered
                          ? "fill-white stroke-amber-500 stroke-2"
                          : "fill-amber-500 stroke-slate-900 stroke-1"
                      }`}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[9.5px] font-bold text-slate-500 dark:text-slate-400 px-2 pt-1">
              {activeDataset.map((b) => (
                <span key={b.label} className={b.label === peakBucket.label ? "text-amber-600 dark:text-amber-400 font-black" : ""}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Scale Indicators ── */}
      <div
        className={`flex items-center justify-between text-[9.5px] font-semibold pt-3 border-t mt-2 ${
          isLight ? "border-slate-100 text-slate-500" : "border-slate-800 text-slate-400"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Metric: <strong>{metric}</strong>
        </span>
        <span className="font-mono">Peak: {formatValue(maxValue)}</span>
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
          <Clock size={11} /> {isWeeklyView ? "7-Day Daily Granularity" : "16 Hourly Operating Windows"}
        </span>
      </div>
    </div>
  );
}
