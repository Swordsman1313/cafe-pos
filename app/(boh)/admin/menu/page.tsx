"use client";

import React, { useEffect, useState } from "react";
import {
  Store,
  RefreshCw,
  Send,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sliders,
  Sparkles,
  Layers,
} from "lucide-react";

export default function MasterMenuAndStoreSync() {
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch("/api/catalog/products");
      const prodJson = await prodRes.json();
      if (prodJson.success) setProducts(prodJson.products);

      const branchRes = await fetch("/api/catalog/sync-stores");
      const branchJson = await branchRes.json();
      if (branchJson.success) setBranches(branchJson.branches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMultiplierChange = (storeId: string, value: number) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === storeId ? { ...b, priceMultiplier: value } : b))
    );
  };

  const execute1ClickSync = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    try {
      const overrideMap: Record<string, number> = {};
      branches.forEach((b) => {
        overrideMap[b.id] = b.priceMultiplier;
      });

      const res = await fetch("/api/catalog/sync-stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStoreIds: branches.map((b) => b.id),
          overridePriceTier: overrideMap,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncSuccess(`✅ Master Catalog & Multipliers pushed to all ${data.syncedStores.length} branch stores successfully!`);
        fetchData();
      }
    } catch (e: any) {
      alert("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Store size={20} className="text-amber-400" /> Master Menu & Multi-Store Price Tiering Sync (#4)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your master menu once and push real-time prices, recipes, and seasonal drinks to all branch terminals with 1 click
          </p>
        </div>

        <button
          onClick={execute1ClickSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition"
        >
          <Send size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Pushing to All Terminals..." : "1-Click Sync All Branch Terminals"}
        </button>
      </div>

      {/* Sync Success Alert */}
      {syncSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Branch Price Tiering Multipliers Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sliders size={16} className="text-amber-400" /> Branch Price Multipliers & Location Tiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">{branch.name}</h4>
                <p className="text-[10px] text-slate-400 mb-3">{branch.address}</p>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">Price Multiplier (x):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2.0"
                    value={branch.priceMultiplier}
                    onChange={(e) => handleMultiplierChange(branch.id, parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Example: $3.00 Latte $\rightarrow$ ${(3.0 * branch.priceMultiplier).toFixed(2)} at this branch
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Master Catalog Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-amber-400" /> Master Menu Catalog ({products.length} Items)
          </h3>
          <span className="text-[11px] text-slate-400">All prices shown in base USD</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 px-3">Product</th>
                <th className="pb-3 px-3">SKU</th>
                <th className="pb-3 px-3">KDS Station</th>
                <th className="pb-3 px-3">Base Price</th>
                <th className="pb-3 px-3">Est. BOM Cost</th>
                <th className="pb-3 px-3">Gross Margin</th>
                <th className="pb-3 px-3">Modifiers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                    <Coffee size={14} className="text-amber-400 shrink-0" />
                    {p.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">{p.sku}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.station === "BARISTA"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {p.station || "BARISTA"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-white">${p.basePrice?.toFixed(2)}</td>
                  <td className="py-3 px-3 text-slate-400">${p.costPrice?.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">{p.grossMarginPercent}%</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {p.modifierGroups?.length || 0} groups (Size, Sweet, Ice, Milk)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
