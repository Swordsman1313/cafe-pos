"use client";

import React, { useState } from "react";
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

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const totalVolume = products.reduce((s, p) => s + p.quantity, 0);

  const medals = ["🥇", "🥈", "🥉"];

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
            <div className="h-7 w-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
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

          <span className="text-[11px] font-extrabold bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-xl border border-amber-500/20">
            {totalVolume} units sold
          </span>
        </div>

        {/* Category Pills Filter */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-all shrink-0 cursor-pointer ${
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

        {/* ── Ranked Beverage List ── */}
        <div className="space-y-3 pt-1">
          {filteredProducts.map((item, idx) => {
            const isTop3 = idx < 3;

            return (
              <div
                key={item.name}
                className={`p-2.5 rounded-2xl border transition-all hover:scale-[1.01] ${
                  isLight
                    ? isTop3
                      ? "bg-amber-50/40 border-amber-200/70"
                      : "bg-slate-50 border-slate-100"
                    : isTop3
                    ? "bg-amber-950/20 border-amber-500/20"
                    : "bg-slate-800/40 border-slate-700/40"
                }`}
              >
                {/* Row Header: Rank, Name, Category & Revenue */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="text-base shrink-0 select-none">
                      {medals[idx] ?? (
                        <span className="text-[11px] font-black text-slate-400 w-5 text-center inline-block">
                          #{idx + 1}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-bold leading-tight truncate text-xs ${isLight ? "text-slate-900" : "text-white"}`}>
                          {item.name}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                          isLight ? "bg-slate-200/80 text-slate-600" : "bg-slate-700 text-slate-300"
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-[10.5px] mt-0.5 font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        <span className="font-extrabold text-amber-500">{item.quantity} sold</span> · {item.shareOfTotalPct}% total mix
                      </p>
                    </div>
                  </div>

                  {/* Revenue display */}
                  <div className="text-right shrink-0">
                    <span className="text-amber-400 font-black text-xs block">
                      ${item.revenueUSD.toFixed(2)}
                    </span>
                    <span className={`text-[9px] font-semibold block ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      {item.revenueKHR.toLocaleString()} ៛
                    </span>
                  </div>
                </div>

                {/* ── Relative Volume Fill Bar ── */}
                <div className="space-y-1">
                  <div className={`h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
                    <div
                      style={{ width: `${item.relativeVolumePct}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0
                          ? "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 shadow-sm shadow-amber-500/50"
                          : idx === 1
                          ? "bg-gradient-to-r from-amber-500 to-amber-400"
                          : "bg-gradient-to-r from-amber-600/70 to-amber-500/60"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-semibold px-0.5">
                    <span>Relative Demand</span>
                    <span className="font-bold text-amber-500">{item.relativeVolumePct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className={`pt-3 border-t mt-4 text-[10px] flex items-center justify-between ${
          isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-500"
        }`}
      >
        <span className="flex items-center gap-1">
          <Award size={12} className="text-amber-400" /> Leaderboard based on live POS sales
        </span>
        <span className="font-bold text-amber-400">
          Top 6 Ranked
        </span>
      </div>
    </div>
  );
}
