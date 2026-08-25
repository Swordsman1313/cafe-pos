"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Search,
  CheckSquare,
  Dot,
  DollarSign,
  Droplets,
  Package,
  Coffee,
  UtensilsCrossed,
} from "lucide-react";

interface OptionItem {
  id: string;
  name: string;
  extraPriceUSD: number;
  costUSD: number;
  isDefault: boolean;
  inventoryDeduction?: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  };
}

interface OptionGroup {
  id: string;
  name: string;
  code: string;
  selectionType: "SINGLE" | "MULTIPLE";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: OptionItem[];
  appliesToCategories: string[];
}

export default function OptionGroupsPage() {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSelectionType, setFormSelectionType] = useState<"SINGLE" | "MULTIPLE">("SINGLE");
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formMinSelect, setFormMinSelect] = useState(0);
  const [formMaxSelect, setFormMaxSelect] = useState(1);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formOptions, setFormOptions] = useState<OptionItem[]>([
    { id: "opt-1", name: "Regular", extraPriceUSD: 0, costUSD: 0, isDefault: true },
  ]);

  const fetchOptionGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/option-groups");
      const data = await res.json();
      if (data.success) {
        setOptionGroups(data.optionGroups);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptionGroups();
  }, []);

  const openAddModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormCode(`OPT-${Date.now().toString().slice(-3)}`);
    setFormSelectionType("SINGLE");
    setFormIsRequired(false);
    setFormMinSelect(0);
    setFormMaxSelect(1);
    setFormSortOrder(optionGroups.length + 1);
    setFormOptions([
      { id: "opt-1", name: "Option 1", extraPriceUSD: 0, costUSD: 0, isDefault: true },
      { id: "opt-2", name: "Option 2", extraPriceUSD: 0.5, costUSD: 0.1, isDefault: false },
    ]);
    setShowModal(true);
  };

  const openEditModal = (group: OptionGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormCode(group.code);
    setFormSelectionType(group.selectionType);
    setFormIsRequired(group.isRequired);
    setFormMinSelect(group.minSelect);
    setFormMaxSelect(group.maxSelect);
    setFormSortOrder(group.sortOrder);
    setFormOptions(
      group.options && group.options.length > 0
        ? group.options
        : [{ id: "opt-1", name: "Default", extraPriceUSD: 0, costUSD: 0, isDefault: true }]
    );
    setShowModal(true);
  };

  const addOptionRow = () => {
    setFormOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}`,
        name: "",
        extraPriceUSD: 0,
        costUSD: 0,
        isDefault: false,
      },
    ]);
  };

  const removeOptionRow = (index: number) => {
    setFormOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOptionRow = (index: number, field: keyof OptionItem, value: any) => {
    setFormOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return;

    try {
      const payload = {
        name: formName,
        code: formCode,
        selectionType: formSelectionType,
        isRequired: formIsRequired,
        minSelect: Number(formMinSelect),
        maxSelect: Number(formMaxSelect),
        sortOrder: Number(formSortOrder),
        options: formOptions.filter((o) => o.name.trim().length > 0),
        appliesToCategories: ["all"],
      };

      if (editingGroup) {
        await fetch("/api/catalog/option-groups", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingGroup.id, ...payload }),
        });
      } else {
        await fetch("/api/catalog/option-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      fetchOptionGroups();
    } catch (e: any) {
      alert("Error saving option group: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this option group?")) return;
    try {
      await fetch(`/api/catalog/option-groups?id=${id}`, { method: "DELETE" });
      fetchOptionGroups();
    } catch (e: any) {
      alert("Error deleting option group: " + e.message);
    }
  };

  const filtered = optionGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders size={22} className="text-amber-500" />
            <span>Option Groups &amp; Modifier Sets</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure drink modifiers (Size, Sweetness, Ice, Milk substitutions, and Extras) with single/multi rules
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Option Group</span>
        </button>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Option Groups</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{optionGroups.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Single Choice (Radio)</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400">
            {optionGroups.filter((g) => g.selectionType === "SINGLE").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Multi Choice (Checkbox)</p>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400">
            {optionGroups.filter((g) => g.selectionType === "MULTIPLE").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Required Selection</p>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400">
            {optionGroups.filter((g) => g.isRequired).length}
          </p>
        </div>
      </div>

      {/* Option Groups Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading option groups...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{group.name}</h3>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {group.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold">
                        {group.selectionType === "SINGLE" ? "Single Choice (Radio)" : "Multi Choice (Checkbox)"}
                      </span>
                      <span>·</span>
                      <span>{group.isRequired ? "Required" : "Optional"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(group)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Option Group"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete Option Group"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Options Pills List */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Configured Choices ({group.options?.length || 0})
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {opt.isDefault && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{opt.name}</span>
                      </div>
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
                        {opt.extraPriceUSD > 0 ? `+$${opt.extraPriceUSD.toFixed(2)}` : "$0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders size={18} className="text-amber-500" />
                <span>{editingGroup ? "Edit Option Group" : "Create Option Group"}</span>
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
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Option Group Name *</label>
                  <input
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sweetness Level"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Group Code Prefix *</label>
                  <input
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. SWEET"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Selection Type</label>
                  <select
                    value={formSelectionType}
                    onChange={(e: any) => setFormSelectionType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="SINGLE">Single Choice (Radio)</option>
                    <option value="MULTIPLE">Multiple Choice (Checkbox)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Min / Max Selection</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={formMinSelect}
                      onChange={(e) => setFormMinSelect(Number(e.target.value))}
                      placeholder="Min"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-900 dark:text-white text-center"
                    />
                    <span className="text-slate-400">/</span>
                    <input
                      type="number"
                      value={formMaxSelect}
                      onChange={(e) => setFormMaxSelect(Number(e.target.value))}
                      placeholder="Max"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-900 dark:text-white text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="grpRequired"
                    checked={formIsRequired}
                    onChange={(e) => setFormIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500"
                  />
                  <label htmlFor="grpRequired" className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
                    Required Selection
                  </label>
                </div>
              </div>

              {/* Options Table in Modal */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-400 font-bold">Modifier Options &amp; Price Adjustment</label>
                  <button
                    type="button"
                    onClick={addOptionRow}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] hover:bg-amber-500/20 cursor-pointer"
                  >
                    + Add Choice
                  </button>
                </div>

                <div className="space-y-1.5">
                  {formOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        placeholder="Option Name (e.g. 50% Sweet)"
                        value={opt.name}
                        onChange={(e) => updateOptionRow(idx, "name", e.target.value)}
                        className="flex-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="+$ Price"
                        value={opt.extraPriceUSD}
                        onChange={(e) => updateOptionRow(idx, "extraPriceUSD", Number(e.target.value))}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-slate-900 dark:text-white font-mono"
                      />
                      <label className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 shrink-0">
                        <input
                          type="checkbox"
                          checked={opt.isDefault}
                          onChange={(e) => updateOptionRow(idx, "isDefault", e.target.checked)}
                          className="h-3.5 w-3.5 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-amber-500"
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => removeOptionRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
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
                  {editingGroup ? "Save Changes" : "Create Option Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
