"use client";

import React, { useState, useRef, useEffect } from "react";
import { Star, Coffee, Trophy, TrendingUp, Sparkles, Award } from "lucide-react";
import { RankedProduct } from "@/lib/analytics-aggregator";

interface TopDrinksRankingProps {
  products: RankedProduct[];
  isLight?: boolean;
}

export default function TopDrinksRanking({
  products,
  isLight = false,
}: TopDrinksRankingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const listRef = useRef<HTMLDivElement>(null);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // Reset scroll to top whenever category filter changes so Rank #1 is always visible
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedCategory]);

  const totalVolume = products.reduce((s, p) => s + p.quantity, 0);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      className={`rounded-3xl border p-5 transition-all flex flex-col justify-between h-full max-w-full overflow-hidden ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Fixed Header ── */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Trophy size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                Top Drinks Ranking
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Relative volume, revenue share &amp; velocity
              </p>
            </div>
          </div>

          <span className="text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-500/30">
            {totalVolume} sold
          </span>
        </div>

        {/* ── Category Pills Filter (Horizontal scrollable with no truncation) ── */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap py-1 mb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                    : isLight
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Internal Scrollable Drinks List with Gradient Mask ── */}
      <div className="relative flex-1 min-h-0">
        {/* Subtle Top & Bottom Gradient Mask Fades */}
        <div className={`pointer-events-none absolute top-0 inset-x-0 h-2 bg-gradient-to-b ${isLight ? "from-white" : "from-slate-900"} to-transparent z-10`} />
        <div className={`pointer-events-none absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t ${isLight ? "from-white" : "from-slate-900"} to-transparent z-10`} />

        <div
          ref={listRef}
          className="h-full overflow-y-auto pr-1.5 py-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-300"
        >
          {filteredProducts.map((item, idx) => {
            const isTop3 = idx < 3;

            return (
              <div
                key={item.name}
                className={`p-3 rounded-2xl border transition-all hover:scale-[1.01] max-w-full overflow-hidden ${
                  isLight
                    ? isTop3
                      ? "bg-amber-50/50 border-amber-200/80"
                      : "bg-slate-50 border-slate-200/80"
                    : isTop3
                    ? "bg-amber-950/20 border-amber-500/20"
                    : "bg-slate-800/40 border-slate-700/40"
                }`}
              >
                {/* Row Header: Rank, Name, Category & Revenue */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <span className="text-base shrink-0 select-none">
                      {medals[idx] ?? (
                        <span className="text-[11px] font-black text-slate-400 w-5 text-center inline-block">
                          #{idx + 1}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`font-bold leading-tight truncate text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                          {item.name}
                        </p>
                        <span className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded-md shrink-0 ${
                          isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-300"
                        }`}>
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-medium px-2 py-0.5 rounded-md text-[11px]">
                          {item.quantity} sold · {item.shareOfTotalPct}% mix
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-extrabold text-sm block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                      ${item.revenueUSD.toFixed(2)}
                    </span>
                    <span className={`font-medium text-[11px] block mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {item.revenueKHR.toLocaleString()} ៛
                    </span>
                  </div>
                </div>

                {/* Relative Volume Fill Bar */}
                <div className="space-y-1 max-w-full overflow-hidden">
                  <div className={`h-1.5 rounded-full overflow-hidden max-w-full ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
                    <div
                      style={{ width: `${Math.min(item.relativeVolumePct, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0
                          ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-sm"
                          : idx === 1
                          ? "bg-gradient-to-r from-amber-500 to-amber-400"
                          : "bg-gradient-to-r from-amber-600/80 to-amber-500/70"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8.5px] text-slate-500 dark:text-slate-400 font-semibold px-0.5">
                    <span>Relative Demand Volume</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{item.relativeVolumePct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Fixed Footer ── */}
      <div
        className={`shrink-0 pt-3 border-t mt-3 text-[10.5px] flex items-center justify-between ${
          isLight ? "border-slate-100 text-slate-500" : "border-slate-800 text-slate-400"
        }`}
      >
        <span className="flex items-center gap-1">
          <Award size={13} className="text-amber-500" /> Bestsellers ranked by revenue
        </span>
        <span className="font-bold text-amber-700 dark:text-amber-400">
          Top {filteredProducts.length} Drinks
        </span>
      </div>
    </div>
  );
}
