"use client";

import React, { useEffect, useState } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Coffee,
  Leaf,
  Snowflake,
  Cookie,
  UtensilsCrossed,
  Package,
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  Sliders,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  iconName: string;
  colorTheme: string;
  sortOrder: number;
  station: "espresso" | "kitchen" | "pastry" | "retail";
  isActive: boolean;
  itemCount?: number;
}

const AVAILABLE_ICONS = [
  { name: "Coffee", icon: Coffee },
  { name: "Leaf", icon: Leaf },
  { name: "Snowflake", icon: Snowflake },
  { name: "Cookie", icon: Cookie },
  { name: "UtensilsCrossed", icon: UtensilsCrossed },
  { name: "Package", icon: Package },
];

const COLOR_PRESETS = [
  { name: "Amber", value: "from-amber-500/20 to-amber-600/10 text-amber-500 border-amber-500/30" },
  { name: "Emerald", value: "from-emerald-500/20 to-emerald-600/10 text-emerald-500 border-emerald-500/30" },
  { name: "Sky", value: "from-sky-500/20 to-sky-600/10 text-sky-500 border-sky-500/30" },
  { name: "Rose", value: "from-rose-500/20 to-rose-600/10 text-rose-500 border-rose-500/30" },
  { name: "Purple", value: "from-purple-500/20 to-purple-600/10 text-purple-500 border-purple-500/30" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formIcon, setFormIcon] = useState("Coffee");
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0].value);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formStation, setFormStation] = useState<"espresso" | "kitchen" | "pastry" | "retail">("espresso");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormCode(`CAT-${Date.now().toString().slice(-3)}`);
    setFormIcon("Coffee");
    setFormColor(COLOR_PRESETS[0].value);
    setFormSortOrder(categories.length + 1);
    setFormStation("espresso");
    setFormIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormCode(cat.code);
    setFormIcon(cat.iconName || "Coffee");
    setFormColor(cat.colorTheme || COLOR_PRESETS[0].value);
    setFormSortOrder(cat.sortOrder);
    setFormStation(cat.station);
    setFormIsActive(cat.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return;

    try {
      const payload = {
        name: formName,
        code: formCode,
        iconName: formIcon,
        colorTheme: formColor,
        sortOrder: Number(formSortOrder),
        station: formStation,
        isActive: formIsActive,
      };

      if (editingCategory) {
        await fetch("/api/catalog/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, ...payload }),
        });
      } else {
        await fetch("/api/catalog/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      fetchCategories();
    } catch (e: any) {
      alert("Error saving category: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetch(`/api/catalog/categories?id=${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (e: any) {
      alert("Error deleting category: " + e.message);
    }
  };

  const filtered = categories.filter(
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
            <FolderTree size={22} className="text-amber-500" />
            <span>Category Hierarchy &amp; Station Routing</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize products into menu categories, assign preparation station printers, and set POS display order
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Categories</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{categories.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active on POS</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {categories.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Espresso Station</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {categories.filter((c) => c.station === "espresso").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pastry &amp; Kitchen</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">
            {categories.filter((c) => c.station === "pastry" || c.station === "kitchen").length}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const IconComp = AVAILABLE_ICONS.find((i) => i.name === cat.iconName)?.icon || Coffee;
            return (
              <div
                key={cat.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {cat.code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Station Routing:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{cat.station}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Display Order:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">#{cat.sortOrder}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">POS Visibility:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cat.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}>
                    {cat.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree size={18} className="text-amber-500" />
                <span>{editingCategory ? "Edit Menu Category" : "Add Menu Category"}</span>
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
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Category Name *</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Specialty Cold Brew"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Code Prefix *</label>
                  <input
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. CLDBRW"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Preparation Station</label>
                <select
                  value={formStation}
                  onChange={(e: any) => setFormStation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                >
                  <option value="espresso">Espresso Bar Station</option>
                  <option value="kitchen">Kitchen Prep Station</option>
                  <option value="pastry">Pastry &amp; Bakery Display</option>
                  <option value="retail">Retail Shelves</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500"
                />
                <label htmlFor="catActive" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
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
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
