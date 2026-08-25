"use client";

import React from "react";
import { PauseCircle, Trash2, ArrowRight } from "lucide-react";
import { HeldOrder, formatUSD } from "./types";

export interface HeldOrdersModalProps {
  isOpen: boolean;
  heldOrders: HeldOrder[];
  onClose: () => void;
  onResumeOrder: (order: HeldOrder) => void;
  onDeleteOrder: (id: string) => void;
}

export function HeldOrdersModal({
  isOpen,
  heldOrders,
  onClose,
  onResumeOrder,
  onDeleteOrder,
}: HeldOrdersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <PauseCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Held Orders</h2>
              <p className="text-xs font-semibold text-slate-400">
                {heldOrders.length} order{heldOrders.length === 1 ? "" : "s"} currently paused
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1 rounded-xl bg-slate-100 transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {heldOrders.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No orders currently on hold.</div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {heldOrders.map((order) => {
              const subtotal = order.cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
              const totalItems = order.cart.reduce((sum, item) => sum + item.qty, 0);
              return (
                <div
                  key={order.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{order.tag}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {totalItems} item{totalItems > 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {formatUSD(subtotal * 1.1)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1">
                    {order.cart.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onDeleteOrder(order.id)}
                      className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => onResumeOrder(order)}
                      className="flex-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Resume Order</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
