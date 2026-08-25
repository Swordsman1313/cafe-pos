"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Droplets,
  DollarSign,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Search,
  Layers,
  ArrowRight,
  Package,
  Sliders,
  UtensilsCrossed,
} from "lucide-react";

interface CondimentItem {
  id: string;
  name: string;
  category: "syrup" | "topping" | "espresso" | "dairy_sub" | "sweetener";
  extraPriceUSD: number;
  costUSD: number;
  inventoryDeduction: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  };
  maxPerDrink: number;
  isActive: boolean;
}

const DEMO_CONDIMENTS: CondimentItem[] = [
  {
    id: "c-01",
    name: "Extra Espresso Shot",
    category: "espresso",
    extraPriceUSD: 0.75,
    costUSD: 0.22,
    inventoryDeduction: {
      ingredientId: "i-01",
      ingredientName: "Ethiopia Blend Beans",
      quantity: 18,
      unit: "g",
    },
    maxPerDrink: 4,
    isActive: true,
  },
  {
    id: "c-02",
    name: "Vanilla Syrup Pump",
    category: "syrup",
    extraPriceUSD: 0.50,
    costUSD: 0.08,
    inventoryDeduction: {
      ingredientId: "i-07",
      ingredientName: "Monin Vanilla Syrup",
      quantity: 15,
      unit: "ml",
    },
    maxPerDrink: 5,
    isActive: true,
  },
  {
    id: "c-03",
    name: "Caramel Drizzle / Syrup",
    category: "syrup",
    extraPriceUSD: 0.50,
    costUSD: 0.09,
    inventoryDeduction: {
      ingredientId: "i-08",
      ingredientName: "Caramel Syrup",
      quantity: 15,
      unit: "ml",
    },
    maxPerDrink: 4,
    isActive: true,
  },
  {
    id: "c-04",
    name: "Hazelnut Syrup",
    category: "syrup",
    extraPriceUSD: 0.50,
    costUSD: 0.08,
    inventoryDeduction: {
      ingredientId: "i-09",
      ingredientName: "Hazelnut Syrup",
      quantity: 15,
      unit: "ml",
    },
    maxPerDrink: 4,
    isActive: true,
  },
  {
    id: "c-05",
    name: "Oat Milk Substitute",
    category: "dairy_sub",
    extraPriceUSD: 0.65,
    costUSD: 0.35,
    inventoryDeduction: {
      ingredientId: "i-05",
      ingredientName: "Oat Milk (Barista)",
      quantity: 200,
      unit: "ml",
    },
    maxPerDrink: 1,
    isActive: true,
  },
  {
    id: "c-06",
    name: "Whipped Cream & Cocoa Dust",
    category: "topping",
    extraPriceUSD: 0.60,
    costUSD: 0.15,
    inventoryDeduction: {
      ingredientId: "i-whipping",
      ingredientName: "Heavy Whipping Cream",
      quantity: 30,
      unit: "g",
    },
    maxPerDrink: 2,
    isActive: true,
  },
  {
    id: "c-07",
    name: "Cheese Foam Cap",
    category: "topping",
    extraPriceUSD: 0.85,
    costUSD: 0.28,
    inventoryDeduction: {
      ingredientId: "i-creamcheese",
      ingredientName: "Cream Cheese Premix",
      quantity: 50,
      unit: "ml",
    },
    maxPerDrink: 2,
    isActive: true,
  },
];

export default function CondimentsPage() {
  const [condiments, setCondiments] = useState<CondimentItem[]>(DEMO_CONDIMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCondiment, setEditingCondiment] = useState<CondimentItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<"syrup" | "topping" | "espresso" | "dairy_sub" | "sweetener">("syrup");
  const [formPrice, setFormPrice] = useState(0.50);
  const [formCost, setFormCost] = useState(0.08);
  const [formIngredient, setFormIngredient] = useState("Vanilla Syrup");
  const [formQty, setFormQty] = useState(15);
  const [formUnit, setFormUnit] = useState("ml");
  const [formMaxPerDrink, setFormMaxPerDrink] = useState(3);
  const [formIsActive, setFormIsActive] = useState(true);

  const openAddModal = () => {
    setEditingCondiment(null);
    setFormName("");
    setFormCategory("syrup");
    setFormPrice(0.50);
    setFormCost(0.08);
    setFormIngredient("Vanilla Syrup");
    setFormQty(15);
    setFormUnit("ml");
    setFormMaxPerDrink(3);
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (cond: CondimentItem) => {
    setEditingCondiment(cond);
    setFormName(cond.name);
    setFormCategory(cond.category);
    setFormPrice(cond.extraPriceUSD);
    setFormCost(cond.costUSD);
    setFormIngredient(cond.inventoryDeduction.ingredientName);
    setFormQty(cond.inventoryDeduction.quantity);
    setFormUnit(cond.inventoryDeduction.unit);
    setFormMaxPerDrink(cond.maxPerDrink);
    setFormIsActive(cond.isActive);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const itemData: CondimentItem = {
      id: editingCondiment ? editingCondiment.id : `c-${Date.now()}`,
      name: formName,
      category: formCategory,
      extraPriceUSD: Number(formPrice),
      costUSD: Number(formCost),
      inventoryDeduction: {
        ingredientId: "i-custom",
        ingredientName: formIngredient,
        quantity: Number(formQty),
        unit: formUnit,
      },
      maxPerDrink: Number(formMaxPerDrink),
      isActive: formIsActive,
    };

    if (editingCondiment) {
      setCondiments((prev) => prev.map((c) => (c.id === editingCondiment.id ? itemData : c)));
    } else {
      setCondiments((prev) => [...prev, itemData]);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this condiment?")) return;
    setCondiments((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = condiments.filter((c) => {
    const matchesCat = selectedCategory === "all" || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles size={22} className="text-amber-500" />
            <span>Condiments, Syrups &amp; Add-on Modifiers</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage extra charges, portion cost margins, and automated recipe ingredient stock deductions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Condiment / Syrup</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Modifiers</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{condiments.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Syrups &amp; Flavors</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {condiments.filter((c) => c.category === "syrup").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Toppings &amp; Foam</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">
            {condiments.filter((c) => c.category === "topping").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Extra Charge</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            ${(condiments.reduce((s, c) => s + c.extraPriceUSD, 0) / (condiments.length || 1)).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All Items" },
            { id: "syrup", label: "Syrups & Flavors" },
            { id: "topping", label: "Toppings & Foam" },
            { id: "espresso", label: "Extra Shots" },
            { id: "dairy_sub", label: "Dairy Subs" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search condiment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Condiment / Modifier</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Extra Charge ($)</th>
              <th className="px-4 py-3.5">Portion Cost ($)</th>
              <th className="px-4 py-3.5">Gross Margin</th>
              <th className="px-4 py-3.5">Inventory Recipe Deduction</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filtered.map((cond) => {
              const margin = cond.extraPriceUSD - cond.costUSD;
              const marginPct = Math.round((margin / (cond.extraPriceUSD || 1)) * 100);
              return (
                <tr key={cond.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Sparkles size={14} />
                    </div>
                    <span>{cond.name}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 capitalize">{cond.category.replace("_", " ")}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    +${cond.extraPriceUSD.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                    ${cond.costUSD.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {marginPct}% (+${margin.toFixed(2)})
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                      -{cond.inventoryDeduction.quantity} {cond.inventoryDeduction.unit} · {cond.inventoryDeduction.ingredientName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(cond)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Condiment"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cond.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Condiment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>{editingCondiment ? "Edit Modifier" : "Add New Modifier"}</span>
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
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Modifier Name *</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vanilla Syrup Pump"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="syrup">Syrup / Flavor</option>
                    <option value="topping">Topping / Foam</option>
                    <option value="espresso">Extra Espresso Shot</option>
                    <option value="dairy_sub">Dairy Substitute</option>
                    <option value="sweetener">Sweetener</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Extra Charge ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Portion Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Max per Drink</label>
                  <input
                    type="number"
                    value={formMaxPerDrink}
                    onChange={(e) => setFormMaxPerDrink(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Recipe Deduction Box */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-slate-700 dark:text-slate-400 font-bold block text-[11px]">
                  Raw Ingredient Stock Deduction
                </label>
                <input
                  value={formIngredient}
                  onChange={(e) => setFormIngredient(e.target.value)}
                  placeholder="Ingredient Name (e.g. Vanilla Syrup)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    placeholder="Deduction Qty"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Unit (ml, g, pcs)"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white text-xs"
                  />
                </div>
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
                  Save Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
