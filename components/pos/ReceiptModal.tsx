"use client";

import React from "react";
import { CheckCircle2, Printer, Plus } from "lucide-react";
import { CompletedOrderRecord, formatUSD, formatKHRDirect } from "./types";

export interface ReceiptModalProps {
  order: CompletedOrderRecord | null;
  onNewOrder: () => void;
}

export function ReceiptModal({ order, onNewOrder }: ReceiptModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs mb-1">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Order #{order.ticketNumber}</h2>
          <p className="text-xs text-slate-400 font-semibold">{new Date(order.timestamp).toLocaleTimeString()}</p>
        </div>

        {/* Receipt Paper Layout */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-xs space-y-2 font-mono">
          <div className="text-center font-sans font-black text-slate-900 border-b border-slate-200 pb-1.5">
            Artisan Roast Café
          </div>

          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <div>
                  <span className="font-bold">{item.qty}x {item.name}</span>
                  {item.customization && (
                    <span className="block text-[10px] text-slate-500 font-sans">{item.customization}</span>
                  )}
                </div>
                <span>${item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-1.5 space-y-0.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (10%):</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-1 text-[11px] text-slate-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Paid via:</span>
              <span className="font-bold uppercase text-slate-900">{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === "CASH" && (
              <>
                <div className="flex justify-between">
                  <span>Tendered:</span>
                  <span>${order.totalReceivedUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Change Given:</span>
                  <span>${order.changeUSD.toFixed(2)} USD + {formatKHRDirect(order.changeKHR)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              try {
                window.print();
              } catch {}
            }}
            className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
          <button
            type="button"
            onClick={onNewOrder}
            className="flex-2 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> New Order
          </button>
        </div>
      </div>
    </div>
  );
}
