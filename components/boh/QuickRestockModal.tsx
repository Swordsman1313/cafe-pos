"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  ShoppingCart,
  Truck,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { IngredientUsage } from "@/lib/analytics-aggregator";

interface QuickRestockModalProps {
  ingredient: IngredientUsage | null;
  onClose: () => void;
  onConfirmRestock: (
    ingredientId: string,
    quantityAdded: number,
    actionType: "replenish" | "po_issued"
  ) => void;
  isLight?: boolean;
}

export default function QuickRestockModal({
  ingredient,
  onClose,
  onConfirmRestock,
  isLight = false,
}: QuickRestockModalProps) {
  const [qtyPacks, setQtyPacks] = useState<number>(ingredient?.suggestedReorderQty || 2);

  // Esc key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!ingredient) return null;

  const totalCost = (ingredient.reorderEstimatedCostUSD || 25) * (qtyPacks / (ingredient.suggestedReorderQty || 1));

  const handleCreatePO = () => {
    onConfirmRestock(ingredient.id, qtyPacks, "po_issued");
    onClose();
  };

  const handleQuickReplenish = () => {
    onConfirmRestock(ingredient.id, qtyPacks, "replenish");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-150 ${
          isLight ? "bg-white text-slate-900 border border-slate-200" : "bg-slate-900 text-white border border-slate-800"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
              <Package size={18} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                Restock: {ingredient.name}
              </h2>
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                SKU: {ingredient.reorderSKU} · {ingredient.category}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Current Burn Alert Box */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            ingredient.status === "critical"
              ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
              : ingredient.status === "po_issued"
              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={16}
              className={
                ingredient.status === "critical"
                  ? "text-rose-400"
                  : ingredient.status === "po_issued"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            />
            <div>
              <span className="font-extrabold text-xs block">
                {ingredient.depletionPct}% Depleted ({ingredient.currentUsed} / {ingredient.capacity} {ingredient.unit})
              </span>
              <span className="text-[10px] font-medium opacity-80">
                Empty in approx. {ingredient.hoursUntilDepletion} hours at current pace
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              ingredient.status === "critical"
                ? "bg-rose-500 text-white"
                : ingredient.status === "po_issued"
                ? "bg-amber-500 text-slate-950"
                : "bg-emerald-500 text-white"
            }`}
          >
            {ingredient.statusLabel}
          </span>
        </div>

        {/* Supplier & Pack Details */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2 text-xs ${
            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"
          }`}
        >
          <div className="flex justify-between">
            <span className="text-slate-400">Supplier:</span>
            <span className="font-bold">{ingredient.supplierName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Standard Pack Size:</span>
            <span className="font-bold">{ingredient.reorderPackSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Est. Unit Cost:</span>
            <span className="font-bold">
              ${(ingredient.reorderEstimatedCostUSD / (ingredient.suggestedReorderQty || 1)).toFixed(2)} / pack
            </span>
          </div>
        </div>

        {/* Reorder Quantity Stepper */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-bold uppercase text-slate-400 block">
            Reorder Quantity (Packs)
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setQtyPacks((q) => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-xl bg-slate-800 text-white font-black text-lg flex items-center justify-center hover:bg-slate-700 transition cursor-pointer"
              >
                −
              </button>
              <div className="flex-1 h-10 rounded-xl border border-slate-700 bg-slate-800/80 flex items-center justify-center font-extrabold text-base">
                {qtyPacks} Packs
              </div>
              <button
                type="button"
                onClick={() => setQtyPacks((q) => q + 1)}
                className="h-10 w-10 rounded-xl bg-slate-800 text-white font-black text-lg flex items-center justify-center hover:bg-slate-700 transition cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="text-right pl-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Total</span>
              <span className="text-lg font-black text-amber-400">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions: Purchase Order vs Immediate Delivery */}
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCreatePO}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>Create Purchase Order (PO) · ${totalCost.toFixed(2)}</span>
          </button>

          <button
            type="button"
            onClick={handleQuickReplenish}
            className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Truck size={15} />
            <span>Log Immediate Delivery (Quick Replenish)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
