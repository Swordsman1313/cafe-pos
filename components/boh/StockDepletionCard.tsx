"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Clock,
  ShoppingCart,
  Layers,
  ArrowUpDown,
  Sparkles,
  Info,
  Package,
} from "lucide-react";
import { IngredientUsage } from "@/lib/analytics-aggregator";
import QuickRestockModal from "./QuickRestockModal";

interface StockDepletionCardProps {
  ingredients: IngredientUsage[];
  isLight?: boolean;
}

export default function StockDepletionCard({
  ingredients: initialIngredients,
  isLight = false,
}: StockDepletionCardProps) {
  const [ingredients, setIngredients] = useState<IngredientUsage[]>(initialIngredients);
  const [filter, setFilter] = useState<"all" | "critical" | "moderate" | "safe">("all");
  const [sortBy, setSortBy] = useState<"depletion" | "hours" | "name">("depletion");
  const [activeRestockItem, setActiveRestockItem] = useState<IngredientUsage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync if prop changes
  React.useEffect(() => {
    setIngredients(initialIngredients);
  }, [initialIngredients]);

  // Counts
  const criticalCount = ingredients.filter((i) => i.status === "critical").length;
  const moderateCount = ingredients.filter((i) => i.status === "moderate").length;
  const safeCount = ingredients.filter((i) => i.status === "healthy").length;

  // Filter & Sort
  const processedList = [...ingredients]
    .filter((item) => {
      if (filter === "critical") return item.status === "critical";
      if (filter === "moderate") return item.status === "moderate";
      if (filter === "safe") return item.status === "healthy";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "depletion") return b.depletionPct - a.depletionPct;
      if (sortBy === "hours") return a.hoursUntilDepletion - b.hoursUntilDepletion;
      return a.name.localeCompare(b.name);
    });

  // Handler for Modal Restock & PO Actions
  const handleConfirmRestock = (
    action: "replenish" | "po_issued",
    qty: number,
    target: IngredientUsage
  ) => {
    if (action === "replenish") {
      // 1. Immediate Quick Delivery: Reset used capacity to 0% (100% full), healthy status
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === target.id
            ? {
                ...i,
                currentUsed: 0,
                depletionPct: 0,
                status: "healthy",
                statusLabel: "Healthy Stock",
                hoursUntilDepletion: 14.5,
              }
            : i
        )
      );
      setToastMessage(`Stock updated: Added ${qty} pack(s) to ${target.name}`);
    } else {
      // 2. Create PO: Mark item status as PO Issued
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === target.id
            ? {
                ...i,
                status: "po_issued",
                statusLabel: "PO Issued · Pending Delivery",
              }
            : i
        )
      );
      setToastMessage(`PO Created: Purchase Order issued for ${target.name} (${target.supplierName})`);
    }

    // Auto-dismiss toast after 3.5 seconds
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div
      className={`rounded-3xl border p-5 transition-all flex flex-col justify-between relative ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Floating Green Toast Notification ── */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-40 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 border border-emerald-300">
          <CheckCircle2 size={16} className="text-slate-950 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header (Clean, no subtitle) ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <Package size={16} />
            </div>
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              Ingredient Burn &amp; Depletion Velocity
            </h2>
          </div>

          {criticalCount > 0 ? (
            <span className="flex items-center gap-1.5 text-[10.5px] font-black bg-rose-500/20 text-rose-400 px-3 py-1 rounded-xl border border-rose-500/30 animate-pulse self-start sm:self-auto">
              <AlertTriangle size={13} /> {criticalCount} Restock Alert{criticalCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10.5px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30 self-start sm:self-auto">
              <CheckCircle2 size={13} /> All Stock Healthy
            </span>
          )}
        </div>

        {/* ── Threshold Filter Chips & Sort Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : isLight
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All ({ingredients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("critical")}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                filter === "critical"
                  ? "bg-rose-500 text-white font-black shadow-xs"
                  : isLight
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Restock Alerts ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("moderate")}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                filter === "moderate"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : isLight
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Moderate ({moderateCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("safe")}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer ${
                filter === "safe"
                  ? "bg-emerald-600 text-white font-black shadow-xs"
                  : isLight
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Safe ({safeCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
            <ArrowUpDown size={11} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`text-[10px] font-bold py-1 px-2 rounded-lg border bg-transparent cursor-pointer ${
                isLight ? "border-slate-200 text-slate-700" : "border-slate-700 text-slate-300"
              }`}
            >
              <option value="depletion">Sort: % Depleted</option>
              <option value="hours">Sort: Hours Left</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* ── Ingredient Usage Items ── */}
        <div className="space-y-2.5 pt-1">
          {processedList.map((item) => {
            const isCritical = item.status === "critical"; // > 85%
            const isModerate = item.status === "moderate"; // 60 - 85%
            const isPOIssued = item.status === "po_issued";

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all hover:scale-[1.005] ${
                  isLight
                    ? isCritical
                      ? "bg-rose-50/60 border-rose-200"
                      : isModerate
                      ? "bg-amber-50/40 border-amber-200/80"
                      : isPOIssued
                      ? "bg-amber-50/70 border-amber-300"
                      : "bg-slate-50 border-slate-100"
                    : isCritical
                    ? "bg-rose-950/20 border-rose-500/30 shadow-xs"
                    : isModerate
                    ? "bg-amber-950/20 border-amber-500/20"
                    : isPOIssued
                    ? "bg-amber-950/30 border-amber-500/30"
                    : "bg-slate-800/40 border-slate-700/40"
                }`}
              >
                {/* Main Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 p-1 bg-black/10 rounded-xl select-none">
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-xs truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                          {item.name}
                        </span>
                        <span
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : isPOIssued
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : isModerate
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </div>

                      {/* Depletion Velocity & ETA */}
                      <div className="flex items-center gap-2 text-[10px] mt-0.5">
                        <span className="font-semibold text-slate-400">
                          Burn: {item.depletionVelocityPerHour} {item.unit}/hr
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className={`font-bold flex items-center gap-1 ${
                          isCritical
                            ? "text-rose-400 font-extrabold animate-pulse"
                            : isPOIssued
                            ? "text-amber-400"
                            : isModerate
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}>
                          <Clock size={10} />
                          {isCritical
                            ? `Empty in ~${item.hoursUntilDepletion} hrs!`
                            : isPOIssued
                            ? "PO Pending Delivery"
                            : `Safe for ~${item.hoursUntilDepletion} hrs`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Depletion Metrics & 1-Tap Restock Action */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="text-right pr-1">
                      <span className={`font-black text-xs block ${
                        isCritical
                          ? "text-rose-500"
                          : isPOIssued
                          ? "text-amber-400"
                          : isModerate
                          ? "text-amber-500"
                          : isLight
                          ? "text-slate-900"
                          : "text-white"
                      }`}>
                        {item.currentUsed} / {item.capacity} {item.unit}
                      </span>
                      <span className={`text-[9.5px] font-semibold block ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                        {item.depletionPct}% Used
                      </span>
                    </div>

                    {/* 1-Tap Action Button */}
                    <button
                      type="button"
                      onClick={() => setActiveRestockItem(item)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                        isCritical
                          ? "bg-rose-500 hover:bg-rose-400 text-white animate-pulse"
                          : isPOIssued
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                          : isModerate
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <ShoppingCart size={13} />
                      <span>{isCritical ? "Restock Now" : isPOIssued ? "PO Pending" : "Manage"}</span>
                    </button>
                  </div>
                </div>

                {/* ── Slim Clean Progress Bar (Repeating percentage labels removed) ── */}
                <div className="mt-2">
                  <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
                    <div
                      style={{ width: `${Math.min(item.depletionPct, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCritical
                          ? "bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 shadow-md shadow-rose-500/50"
                          : isPOIssued
                          ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-xs shadow-amber-500/30"
                          : isModerate
                          ? "bg-gradient-to-r from-amber-600 to-amber-400 shadow-xs shadow-amber-500/30"
                          : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Single Global Threshold Legend Footer ── */}
      <div
        className={`pt-3 border-t mt-4 text-[9.5px] flex flex-wrap items-center justify-between gap-2 ${
          isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> &lt;60% Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" /> 60–85% Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" /> &gt;85% Restock Alert
          </span>
        </div>
        <span className="font-semibold text-slate-400">
          Showing {processedList.length} of {ingredients.length} items
        </span>
      </div>

      {/* Quick Restock Dialog Modal */}
      {activeRestockItem && (
        <QuickRestockModal
          ingredient={activeRestockItem}
          onClose={() => setActiveRestockItem(null)}
          onConfirmRestock={(_id, qty, action) => handleConfirmRestock(action, qty, activeRestockItem)}
          isLight={isLight}
        />
      )}
    </div>
  );
}
