"use client";

import React, { useEffect, useState } from "react";
import {
  Coffee,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Package,
  Sliders,
  UtensilsCrossed,
  Leaf,
  Snowflake,
  Cookie,
} from "lucide-react";

interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  costPrice: number;
  grossMarginUSD: number;
  grossMarginPercent: number;
  customizable: boolean;
  station: "BARISTA" | "KITCHEN" | "BOTH";
  isActive: boolean;
  attachedOptionGroupIds?: string[];
  recipes?: any[];
}

const CATEGORIES_LIST = [
  { id: "cat-1", name: "Espresso & Coffee", icon: Coffee },
  { id: "cat-2", name: "Specialty Tea", icon: Leaf },
  { id: "cat-3", name: "Ice Frappé", icon: Snowflake },
  { id: "cat-4", name: "Fresh Pastries", icon: Cookie },
  { id: "cat-5", name: "Breakfast & Combos", icon: UtensilsCrossed },
  { id: "cat-6", name: "Retail Beans", icon: Package },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("cat-1");
  const [formPrice, setFormPrice] = useState(3.50);
  const [formCost, setFormCost] = useState(0.85);
  const [formStation, setFormStation] = useState<"BARISTA" | "KITCHEN" | "BOTH">("BARISTA");
  const [formCustomizable, setFormCustomizable] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`SKU-${Date.now().toString().slice(-4)}`);
    setFormCategory("cat-1");
    setFormPrice(3.50);
    setFormCost(0.85);
    setFormStation("BARISTA");
    setFormCustomizable(true);
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.categoryId || "cat-1");
    setFormPrice(p.price);
    setFormCost(p.costPrice || 0.85);
    setFormStation(p.station || "BARISTA");
    setFormCustomizable(p.customizable !== false);
    setFormIsActive(p.isActive !== false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku) return;

    try {
      const payload = {
        name: formName,
        sku: formSku,
        categoryId: formCategory,
        price: Number(formPrice),
        costPrice: Number(formCost),
        station: formStation,
        customizable: formCustomizable,
        isActive: formIsActive,
      };

      await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      fetchProducts();
    } catch (e: any) {
      alert("Error saving product: " + e.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.categoryId === selectedCat;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coffee size={22} className="text-amber-500" />
            <span>Master Product Catalog &amp; Pricing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure menu items, barcode SKUs, selling prices ($/៛), COGS portion costing, and preparation stations
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Products</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{products.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Selling Price</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            ${(products.reduce((s, p) => s + p.price, 0) / (products.length || 1)).toFixed(2)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Gross Margin</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {(products.reduce((s, p) => s + (p.grossMarginPercent || 70), 0) / (products.length || 1)).toFixed(1)}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customizable Drinks</p>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400">
            {products.filter((p) => p.customizable).length}
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCat === "all"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES_LIST.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCat === cat.id
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No products match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Product Name &amp; SKU</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Selling Price</th>
                  <th className="px-4 py-3.5">Est. COGS Cost</th>
                  <th className="px-4 py-3.5">Gross Margin</th>
                  <th className="px-4 py-3.5">Station</th>
                  <th className="px-4 py-3.5">Modifiers</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filtered.map((prod) => {
                  const catName =
                    CATEGORIES_LIST.find((c) => c.id === prod.categoryId)?.name ||
                    prod.categoryName ||
                    "General";
                  const marginPct =
                    prod.grossMarginPercent ||
                    Math.round(((prod.price - prod.costPrice) / (prod.price || 1)) * 100);
                  const marginUSD = prod.price - prod.costPrice;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Coffee size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                              {prod.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{prod.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{catName}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">${prod.price.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {(prod.price * 4000).toLocaleString("en-US")} ៛
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        ${prod.costPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                          {marginPct}% (${marginUSD.toFixed(2)})
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {prod.station}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {prod.customizable ? (
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            Size/Sweet/Ice
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Fixed Item</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee size={18} className="text-amber-500" />
                <span>{editingProduct ? "Edit Menu Product" : "Add New Menu Product"}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Product Name *</label>
                  <input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Spanish Latte"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Barcode / SKU *</label>
                  <input
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. PROD-SPL"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">COGS Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Station Routing</label>
                  <select
                    value={formStation}
                    onChange={(e: any) => setFormStation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="BARISTA">Barista Counter</option>
                    <option value="KITCHEN">Kitchen Station</option>
                    <option value="BOTH">Both Stations</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="prodCustom"
                    checked={formCustomizable}
                    onChange={(e) => setFormCustomizable(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500"
                  />
                  <label htmlFor="prodCustom" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                    Enable Drink Customization
                  </label>
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
                  {editingProduct ? "Save Product Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
