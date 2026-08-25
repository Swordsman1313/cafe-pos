"use client";

import React, { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  Percent,
  CheckCircle2,
  Coffee,
  Cookie,
  Sparkles,
  Search,
  Tag,
  ArrowRight,
  Layers,
  Sliders,
  Package,
} from "lucide-react";

interface ComboItem {
  id: string;
  name: string;
  code: string;
  comboPriceUSD: number;
  regularPriceUSD: number;
  savingUSD: number;
  availableDays: string[];
  timeWindow: string;
  isActive: boolean;
  sections: {
    title: string;
    required: boolean;
    productIds: string[];
    defaultProductId?: string;
  }[];
}

export default function CombosPage() {
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formComboPrice, setFormComboPrice] = useState(4.50);
  const [formRegularPrice, setFormRegularPrice] = useState(5.50);
  const [formTimeWindow, setFormTimeWindow] = useState("06:30 AM - 11:30 AM");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/combos");
      const data = await res.json();
      if (data.success) {
        setCombos(data.combos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const openAddModal = () => {
    setEditingCombo(null);
    setFormName("");
    setFormCode(`CMB-${Date.now().toString().slice(-4)}`);
    setFormComboPrice(4.50);
    setFormRegularPrice(5.50);
    setFormTimeWindow("06:30 AM - 11:30 AM");
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (combo: ComboItem) => {
    setEditingCombo(combo);
    setFormName(combo.name);
    setFormCode(combo.code);
    setFormComboPrice(combo.comboPriceUSD);
    setFormRegularPrice(combo.regularPriceUSD);
    setFormTimeWindow(combo.timeWindow);
    setFormIsActive(combo.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      const payload = {
        name: formName,
        code: formCode,
        comboPriceUSD: Number(formComboPrice),
        regularPriceUSD: Number(formRegularPrice),
        timeWindow: formTimeWindow,
        isActive: formIsActive,
      };

      if (editingCombo) {
        await fetch("/api/catalog/combos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCombo.id, ...payload }),
        });
      } else {
        await fetch("/api/catalog/combos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      fetchCombos();
    } catch (e: any) {
      alert("Error saving combo: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combo?")) return;
    try {
      await fetch(`/api/catalog/combos?id=${id}`, { method: "DELETE" });
      fetchCombos();
    } catch (e: any) {
      alert("Error deleting combo: " + e.message);
    }
  };

  const filtered = combos.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed size={22} className="text-amber-500" />
            <span>Combos, Breakfast Deals &amp; Value Bundles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create promotional pairings (Coffee + Croissant, Afternoon Tea Sets) with automated package discounts and time schedules
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Create New Combo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Combos</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{combos.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Customer Savings</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ${(combos.reduce((s, c) => s + c.savingUSD, 0) / (combos.length || 1)).toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Breakfast Sets</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {combos.filter((c) => c.timeWindow.includes("AM")).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Afternoon Sets</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">
            {combos.filter((c) => c.timeWindow.includes("PM")).length}
          </p>
        </div>
      </div>

      {/* Combos Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading combos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((combo) => (
            <div
              key={combo.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold ring-1 ring-purple-500/20">
                    <UtensilsCrossed size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{combo.name}</h3>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {combo.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>{combo.timeWindow}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(combo)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Combo"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(combo.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete Combo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Price & Savings Pill */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Bundle Price</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">${combo.comboPriceUSD.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 line-through">${combo.regularPriceUSD.toFixed(2)}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Save ${combo.savingUSD.toFixed(2)}
                </span>
              </div>

              {/* Included Sections Preview */}
              <div className="space-y-1 text-xs">
                {combo.sections?.map((sec, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600 dark:text-slate-400 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-amber-500" />
                      <span className="text-slate-800 dark:text-slate-300 font-semibold">{sec.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{sec.productIds.length} Options</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-amber-500" />
                <span>{editingCombo ? "Edit Combo Set" : "Create New Combo Set"}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Combo Deal Name *</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Morning Perk: Coffee + Croissant"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Combo Bundle Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formComboPrice}
                    onChange={(e) => setFormComboPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Regular Ala Carte Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRegularPrice}
                    onChange={(e) => setFormRegularPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Active Time Window</label>
                <input
                  value={formTimeWindow}
                  onChange={(e) => setFormTimeWindow(e.target.value)}
                  placeholder="e.g. 06:30 AM - 11:30 AM (or All Day)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="comboActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500"
                />
                <label htmlFor="comboActive" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                  Active &amp; Visible on POS Register
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black shadow-md transition cursor-pointer"
                >
                  {editingCombo ? "Save Changes" : "Create Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
