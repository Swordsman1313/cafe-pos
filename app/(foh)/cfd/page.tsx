"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, QrCode, CheckCircle2, Sparkles, ArrowLeft, Heart, Receipt } from "lucide-react";

interface LiveCartItem {
  name: string;
  qty: number;
  price: number;
  customization?: string;
}

interface LiveCartState {
  storeName: string;
  ticketNo: string;
  channel: string;
  items: LiveCartItem[];
  subtotal: number;
  discountUSD: number;
  appliedPromo?: string | null;
  tax: number;
  total: number;
  mode: string;
  lastCompletedSale?: any;
  updatedAt: number;
}

export default function CustomerFacingDisplay() {
  const [liveState, setLiveState] = useState<LiveCartState | null>(null);

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem("pos_live_cart");
      if (raw) {
        setLiveState(JSON.parse(raw));
      }
    } catch {}
  };

  useEffect(() => {
    loadFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pos_live_cart") loadFromStorage();
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(loadFromStorage, 1000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const items = liveState?.items || [];
  const hasItems = items.length > 0;
  const isPaid = liveState?.mode === "completed" || Boolean(liveState?.lastCompletedSale);
  const totalUSD = liveState?.total || 0;
  const totalKHR = Math.round(totalUSD * 4000);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans p-4 sm:p-6 select-none">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full gap-4">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 rounded-2xl px-5 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Coffee size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">Artisan Roast Café</h1>
              <p className="text-[11px] text-amber-400 font-semibold">Specialty Roastery • Customer Display</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
              {liveState?.channel || "WALK-IN"} · Ticket #{liveState?.ticketNo || "1153"}
            </span>
            <Link
              href="/pos"
              className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/60 transition"
            >
              <ArrowLeft size={12} /> POS Register
            </Link>
          </div>
        </div>

        {/* Main Display Body */}
        {isPaid ? (
          /* Payment Completed Celebration Screen */
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-24 w-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mb-5 shadow-2xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Payment Received!</h2>
            <p className="text-base text-emerald-400 font-bold mt-2">
              Order #{liveState?.lastCompletedSale?.ticketNumber || liveState?.ticketNo} is being prepared
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-3 leading-relaxed">
              Thank you for visiting Artisan Roast Café! Your barista is crafting your beverage right now.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
              <Heart size={14} className="text-rose-500 fill-rose-500" /> Made with 100% Single-Origin Beans
            </div>
          </div>
        ) : (
          /* Active Order / Live Scanning View */
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
            {/* Left: Order Items & Subtotals */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-xl min-h-0">
              <div className="flex flex-col min-h-0 flex-1">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Receipt size={14} /> Your Order ({items.length} items)
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Live Register</span>
                </div>

                {/* Items List */}
                <div className="mt-3 space-y-2 overflow-y-auto pr-1 flex-1">
                  {!hasItems ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                      <Coffee size={32} className="opacity-30 mb-2" />
                      <p className="text-sm font-semibold">Welcome to Artisan Roast Café!</p>
                      <p className="text-xs text-slate-500 mt-1">Your order will appear here as your barista inputs it</p>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-in fade-in duration-150"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">
                            {item.qty}× {item.name}
                          </p>
                          {item.customization && (
                            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                              {item.customization}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white">${item.price.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Running Totals */}
              <div className="pt-4 border-t border-slate-800 space-y-1.5 shrink-0 mt-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-200 font-semibold">${liveState?.subtotal?.toFixed(2) || "0.00"}</span>
                </div>
                {Boolean(liveState?.discountUSD && liveState.discountUSD > 0) && (
                  <div className="flex justify-between text-xs text-amber-400 font-semibold">
                    <span>Discount {liveState?.appliedPromo ? `(${liveState.appliedPromo})` : ""}</span>
                    <span>-${(liveState?.discountUSD || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tax (10%)</span>
                  <span className="text-slate-200 font-semibold">${liveState?.tax?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                  <span className="text-base font-extrabold text-white">Total Due</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400">${totalUSD.toFixed(2)} USD</span>
                    <span className="block text-xs font-bold text-slate-400">
                      {totalKHR.toLocaleString()} ៛ KHR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: ABA PAY / KHQR Dynamic Scan Box */}
            <div className="w-full md:w-84 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-between text-center shadow-xl">
              {/* KHQR Card Slip */}
              <div className="w-full max-w-[240px] rounded-2xl border border-slate-700 bg-white text-slate-900 overflow-hidden shadow-2xl">
                <div className="bg-[#e60028] text-white py-1.5 px-3 font-black tracking-widest text-xs uppercase flex items-center justify-center">
                  KHQR
                </div>
                <div className="p-3 text-center space-y-2">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-slate-400">ARTISAN ROAST CAFÉ</p>
                    <p className="text-base font-black text-slate-900">${totalUSD.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-500">{totalKHR.toLocaleString()} ៛</p>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-center">
                    <div className="relative p-2 rounded-xl bg-white border border-slate-100 shadow-inner">
                      <QrCode size={130} className="text-slate-950" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-7 w-7 rounded-full bg-[#e60028] flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                          ABA
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] font-semibold text-slate-500">
                    Scan with ABA, ACLEDA, or any Bakong App
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <Sparkles size={14} /> Zero-Fee Instant Payment
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
