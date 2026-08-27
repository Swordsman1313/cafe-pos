"use client";

import React, { useState } from "react";
import { Package, AlertTriangle, CheckCircle2, Droplet, Sparkles, RefreshCw, Layers } from "lucide-react";
import { IngredientUsage } from "@/lib/analytics-aggregator";

interface StockDepletionCardProps {
  ingredients: IngredientUsage[];
  isLight?: boolean;
  onRestockClick?: (item: IngredientUsage) => void;
}

export default function StockDepletionCard({
  ingredients,
  isLight = false,
  onRestockClick,
}: StockDepletionCardProps) {
  const [filter, setFilter] = useState<"all" | "alerts">("all");

  const alertItemsCount = ingredients.filter((i) => i.status === "critical").length;

  const displayList =
    filter === "alerts"
      ? ingredients.filter((i) => i.status === "critical" || i.status === "moderate")
      : ingredients;

  return (
    <div
      className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <Package size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                Ingredient Burn &amp; Stock Depletion
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Real-time usage vs daily operational safety stock
              </p>
            </div>
          </div>

          {alertItemsCount > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-black bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-xl border border-rose-500/30 animate-pulse">
              <AlertTriangle size={12} /> {alertItemsCount} Restock Alert{alertItemsCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              <CheckCircle2 size={12} /> Healthy Stock
            </span>
          )}
        </div>

        {/* Filter Toggle: All vs Depleted */}
        <div className="flex items-center gap-1 mb-3">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : isLight
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            All Ingredients ({ingredients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("alerts")}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
              filter === "alerts"
                ? "bg-rose-500 text-white font-black shadow-xs"
                : isLight
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            High Depletion ({ingredients.filter((i) => i.depletionPct >= 60).length})
          </button>
        </div>

        {/* ── Ingredient Usage Items ── */}
        <div className="space-y-3.5 pt-1">
          {displayList.map((item) => {
            const isCritical = item.status === "critical"; // > 85%
            const isModerate = item.status === "moderate"; // 60 - 85%

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLight
                    ? isCritical
                      ? "bg-rose-50/50 border-rose-200"
                      : isModerate
                      ? "bg-amber-50/40 border-amber-200/80"
                      : "bg-slate-50 border-slate-100"
                    : isCritical
                    ? "bg-rose-950/20 border-rose-500/30 shadow-xs"
                    : isModerate
                    ? "bg-amber-950/20 border-amber-500/20"
                    : "bg-slate-800/40 border-slate-700/40"
                }`}
              >
                {/* Top Row: Icon, Name, Values & Threshold Badge */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg select-none">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                          {item.name}
                        </span>
                      </div>
                      <span className={`text-[9.5px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Badge & Usage Numbers */}
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`font-extrabold text-xs ${
                        isCritical ? "text-rose-500" : isModerate ? "text-amber-500" : isLight ? "text-slate-900" : "text-white"
                      }`}>
                        {item.currentUsed} / {item.capacity} {item.unit}
                      </span>
                      {isCritical && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse shadow-xs">
                          ⚠️ Restock Alert
                        </span>
                      )}
                      {isModerate && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Moderate
                        </span>
                      )}
                      {!isCritical && !isModerate && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          Healthy
                        </span>
                      )}
                    </div>
                    <span className={`text-[9.5px] font-semibold block mt-0.5 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      {item.depletionPct}% Capacity Burned
                    </span>
                  </div>
                </div>

                {/* ── Progress Bar with Dynamic Threshold Colors ── */}
                <div className="space-y-1 mt-1">
                  <div className={`h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
                    <div
                      style={{ width: `${Math.min(item.depletionPct, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCritical
                          ? "bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 shadow-md shadow-rose-500/50"
                          : isModerate
                          ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-xs shadow-amber-500/30"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      }`}
                    />
                  </div>

                  {/* Threshold Indicators */}
                  <div className="flex justify-between text-[8px] font-semibold text-slate-400 px-0.5">
                    <span>0% (Full)</span>
                    <span className={item.depletionPct >= 60 && item.depletionPct < 85 ? "text-amber-500 font-bold" : ""}>
                      60% Warning
                    </span>
                    <span className={item.depletionPct >= 85 ? "text-rose-500 font-bold" : ""}>
                      85% Restock Line
                    </span>
                    <span>100% (Depleted)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend Footer ── */}
      <div
        className={`pt-3 border-t mt-4 text-[9.5px] flex flex-wrap items-center justify-between gap-2 ${
          isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;60% Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> 60–85% Moderate
          </span>
          <span className="flex items-center gap-1 font-bold text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" /> &gt;85% Restock Alert
          </span>
        </div>
      </div>
    </div>
  );
}
