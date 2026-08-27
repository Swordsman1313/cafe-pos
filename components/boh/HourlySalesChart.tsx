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
} from "lucide-react";
import { HourlyBucket } from "@/lib/analytics-aggregator";

interface HourlySalesChartProps {
  data: HourlyBucket[];
  isLight?: boolean;
  khrRate?: number;
}

export default function HourlySalesChart({
  data,
  isLight = false,
  khrRate = 4100,
}: HourlySalesChartProps) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");
  const [viewMode, setViewMode] = useState<"bar" | "area">("bar");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate dynamic max value for scaling
  const maxValue = useMemo(() => {
    if (metric === "revenue") {
      const maxUSD = Math.max(...data.map((d) => d.revenueUSD), 10);
      return currency === "USD" ? maxUSD : maxUSD * khrRate;
    }
    return Math.max(...data.map((d) => d.orders), 5);
  }, [data, metric, currency, khrRate]);

  // Peak bucket identification
  const peakBucket = useMemo(() => {
    return [...data].sort((a, b) => (metric === "revenue" ? b.revenueUSD - a.revenueUSD : b.orders - a.orders))[0] || data[3];
  }, [data, metric]);

  const totalRevenueUSD = useMemo(() => data.reduce((s, d) => s + d.revenueUSD, 0), [data]);
  const totalOrders = useMemo(() => data.reduce((s, d) => s + d.orders, 0), [data]);

  // Generate SVG path for Area View
  const areaPath = useMemo(() => {
    if (data.length === 0) return { area: "", line: "" };
    const width = 800;
    const height = 160;
    const padding = 20;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((d, i) => {
      const val = metric === "revenue" ? (currency === "USD" ? d.revenueUSD : d.revenueUSD * khrRate) : d.orders;
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = height - padding - (val / Math.max(maxValue, 1)) * chartH;
      return { x, y };
    });

    const lineCommands = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      // Smooth cubic bezier curve
      const prev = points[i - 1];
      const cpX = (prev.x + p.x) / 2;
      return `${acc} C ${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
    }, "");

    const first = points[0];
    const last = points[points.length - 1];
    const areaCommands = `${lineCommands} L ${last.x},${height - padding} L ${first.x},${height - padding} Z`;

    return { area: areaCommands, line: lineCommands, points };
  }, [data, metric, currency, maxValue, khrRate]);

  const hoveredBucket = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      className={`rounded-3xl border p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Top Header Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
              <BarChart3 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                Hourly Sales &amp; Rush Velocity
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Flame size={10} className="fill-amber-400" /> Peak {peakBucket.label}
                </span>
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Revenue, volume &amp; ticket velocity from 6:00 AM to 9:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Control Toggles: Metric, Currency, View Mode */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Currency Toggle (only active in revenue mode) */}
          {metric === "revenue" && (
            <div
              className={`flex items-center p-0.5 rounded-xl border text-[10px] font-black ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/80 border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : isLight
                    ? "text-slate-500 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("KHR")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === "KHR"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : isLight
                    ? "text-slate-500 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                KHR (៛)
              </button>
            </div>
          )}

          {/* Metric Toggle: Revenue / Orders */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-[10px] font-black ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/80 border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => setMetric("revenue")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metric === "revenue"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-xs"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <DollarSign size={11} /> Revenue
            </button>
            <button
              type="button"
              onClick={() => setMetric("orders")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                metric === "orders"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-xs"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Ticket size={11} /> Tickets
            </button>
          </div>

          {/* View Mode: Bar / Area */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-[10px] font-black ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/80 border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("bar")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "bar"
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
              onClick={() => setViewMode("area")}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === "area"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Wave
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Hover Tooltip Callout ── */}
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
              <span className="font-bold">{hoveredBucket.label} Window:</span>
              <span className="font-black text-amber-500">
                ${hoveredBucket.revenueUSD.toFixed(2)} ({hoveredBucket.revenueKHR.toLocaleString()} ៛)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
              <span>{hoveredBucket.orders} Tickets</span>
              <span>Avg: ${hoveredBucket.avgTicketUSD.toFixed(2)}</span>
              <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold">
                {hoveredBucket.pctOfDaily}% of Day
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" /> Hover over any hour bar for granular revenue &amp; ticket breakdown
            </span>
            <span className="font-bold text-amber-400">
              Total Today: ${totalRevenueUSD.toFixed(2)} · {totalOrders} Orders
            </span>
          </div>
        )}
      </div>

      {/* ── Visual Chart Canvas ── */}
      <div className="relative w-full" style={{ minHeight: "170px" }}>
        {viewMode === "bar" ? (
          /* ── 1. Responsive Bar Chart with Amber Peak Highlighting ── */
          <div className="flex items-end gap-1 sm:gap-2 h-40 w-full pt-4 pb-2">
            {data.map((bucket, idx) => {
              const val =
                metric === "revenue"
                  ? currency === "USD"
                    ? bucket.revenueUSD
                    : bucket.revenueUSD * khrRate
                  : bucket.orders;

              const heightPct = Math.max(6, Math.round((val / Math.max(maxValue, 1)) * 100));
              const isPeak = bucket.isPeak;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={bucket.hour}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer transition-all relative min-w-0"
                >
                  {/* Peak Indicator Icon Above Bar */}
                  {isPeak && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 animate-bounce">
                      <Flame size={12} className="text-amber-400 fill-amber-400 drop-shadow-md" />
                    </div>
                  )}

                  {/* Value Label on Top of Bar */}
                  <span
                    className={`text-[8.5px] font-bold mb-1 transition-all truncate max-w-full ${
                      isHovered || isPeak
                        ? "text-amber-400 font-extrabold scale-110"
                        : isLight
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {metric === "revenue"
                      ? currency === "USD"
                        ? `$${bucket.revenueUSD.toFixed(0)}`
                        : `${Math.round(bucket.revenueUSD * khrRate / 1000)}k`
                      : bucket.orders}
                  </span>

                  {/* The Bar Track */}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isPeak
                          ? "bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-lg shadow-amber-500/40 ring-1 ring-amber-300"
                          : isHovered
                          ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-500/20"
                          : isLight
                          ? "bg-gradient-to-t from-amber-700/60 to-amber-500/40 hover:from-amber-600 hover:to-amber-400"
                          : "bg-gradient-to-t from-slate-700/90 to-amber-600/50 hover:from-amber-600 hover:to-amber-400"
                      }`}
                    />
                  </div>

                  {/* X-Axis Hour Label */}
                  <span
                    className={`text-[9px] mt-1.5 font-bold transition-colors truncate max-w-full ${
                      isPeak
                        ? "text-amber-400 font-extrabold"
                        : isHovered
                        ? "text-white"
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
          /* ── 2. Smooth SVG Area Curve View ── */
          <div className="w-full h-40 pt-2 pb-2 flex flex-col justify-between">
            <svg viewBox="0 0 800 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#D97706" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="20" x2="780" y2="20" stroke={isLight ? "#E2E8F0" : "#334155"} strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="780" y2="80" stroke={isLight ? "#E2E8F0" : "#334155"} strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="780" y2="140" stroke={isLight ? "#CBD5E1" : "#475569"} />

              {/* Gradient Filled Area */}
              <path d={areaPath.area} fill="url(#areaGradient)" />

              {/* Stroke Line */}
              <path
                d={areaPath.line}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Point Circles */}
              {areaPath.points?.map((p, idx) => {
                const b = data[idx];
                const isHovered = hoveredIndex === idx;
                const isPeak = b.isPeak;

                return (
                  <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isPeak ? 6 : isHovered ? 5 : 3.5}
                      className={`transition-all ${
                        isPeak
                          ? "fill-amber-300 stroke-amber-600 stroke-2 shadow-md"
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
            <div className="flex justify-between text-[9px] font-bold text-slate-400 px-1 pt-1">
              {data
                .filter((_, i) => i % 2 === 0 || i === data.length - 1)
                .map((b) => (
                  <span key={b.hour} className={b.isPeak ? "text-amber-400 font-black" : ""}>
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
          isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-500"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {metric === "revenue" ? "Revenue Volume ($ / ៛)" : "Order Tickets"}
        </span>
        <span className="font-mono">
          Max: {metric === "revenue" ? (currency === "USD" ? `$${maxValue.toFixed(0)}` : `${maxValue.toLocaleString()} ៛`) : `${maxValue} tix`}
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-bold">
          <Clock size={11} /> 16-Hour Café Window
        </span>
      </div>
    </div>
  );
}
