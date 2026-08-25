"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Banknote,
  QrCode,
  Hash,
  Tag,
  PauseCircle,
  ChevronRight,
  ChevronLeft,
  Moon,
  Calendar,
  ArrowLeft,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  CartItem,
  CartAction,
  ShiftState,
  HeldOrder,
  formatUSD,
  formatKHR,
} from "./types";
import { PaymentChoiceModal } from "./PaymentChoiceModal";

export interface CartPanelProps {
  cart: CartItem[];
  dispatch: React.Dispatch<CartAction>;
  shift: ShiftState | null;
  heldOrders: HeldOrder[];
  orderChannel: string;
  setOrderChannel: (ch: string) => void;
  onHoldOrder: () => void;
  onOpenHeldOrders: () => void;
  onOpenEndShift: () => void;
  onOpenEndDay: () => void;
  onCompleteOrder: (paymentDetails: {
    method: "CASH" | "KHQR" | "CREDIT";
    totalReceivedUSD: number;
    receivedUSD: string;
    receivedKHR: string;
    changeUSD: number;
    changeKHR: number;
    usdGiven: number;
    rielGiven: number;
  }) => void;
}

export function CartPanel({
  cart,
  dispatch,
  shift,
  heldOrders,
  orderChannel,
  setOrderChannel,
  onHoldOrder,
  onOpenHeldOrders,
  onOpenEndShift,
  onOpenEndDay,
  onCompleteOrder,
}: CartPanelProps) {
  const [rightPanelMode, setRightPanelMode] = useState<"actions" | "paymentChoice" | "qtyNumpad">("actions");
  const [cartActionTab, setCartActionTab] = useState<number>(0);

  // Promo / Discount
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [discountUSD, setDiscountUSD] = useState<number>(0);

  // Customizing Item
  const [customizingItem, setCustomizingItem] = useState<CartItem | null>(null);

  // Quantity Keypad
  const [qtyInput, setQtyInput] = useState<string>("");
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);

  // Subtotals
  const subtotalUSD = cart.reduce((sum, item) => sum + item.basePrice * item.qty, 0);
  const discountedSubtotalUSD = Math.max(0, subtotalUSD - discountUSD);
  const taxUSD = discountedSubtotalUSD * 0.1;
  const totalUSD = discountedSubtotalUSD + taxUSD;

  const activeItem = cart.find((i) => i.id === activeCartItemId) || cart[cart.length - 1];

  const handleOpenQtyNumpad = () => {
    if (cart.length === 0) return;
    setActiveCartItemId(cart[cart.length - 1].id);
    setQtyInput(String(cart[cart.length - 1].qty));
    setRightPanelMode("qtyNumpad");
  };

  return (
    <aside className="flex w-80 sm:w-96 shrink-0 flex-col justify-between border-l border-slate-200/80 bg-white shadow-xl z-20">
      {/* Top Header: Channel Tabs & Cart Count */}
      <div className="border-b border-slate-200/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
            <ShoppingCart size={16} className="text-amber-600" />
            <span>Current Order</span>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "CLEAR" })}
              className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
              title="Clear Cart"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          {["WALK-IN", "TAKEAWAY", "DELIVERY"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setOrderChannel(ch)}
              className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                orderChannel === ch
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-16 text-slate-400">
            <ShoppingCart size={36} className="text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-600">Cart is empty</p>
            <p className="text-[11px] text-slate-400">Tap items on the left to add to order</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setActiveCartItemId(item.id);
                setCustomizingItem(item);
              }}
              className={`group p-2.5 rounded-2xl border transition-all cursor-pointer ${
                activeCartItemId === item.id
                  ? "bg-amber-50/50 border-amber-300 shadow-2xs"
                  : "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-slate-900 truncate">{item.name}</span>
                    {item.size ? (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                        {item.size}
                      </span>
                    ) : null}
                  </div>
                  {(item.sweetness || item.ice) ? (
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5 space-x-1">
                      {item.sweetness && <span>{item.sweetness} Sugar</span>}
                      {item.sweetness && item.ice && <span>·</span>}
                      {item.ice && <span>{item.ice}</span>}
                    </div>
                  ) : null}
                </div>

                <span className="text-xs font-black text-slate-900">
                  {formatUSD(item.basePrice * item.qty)}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "UPDATE_QTY", id: item.id, qty: item.qty - 1 });
                    }}
                    className="h-6 w-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-7 text-center font-black text-xs text-slate-900">{item.qty}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "UPDATE_QTY", id: item.id, qty: item.qty + 1 });
                    }}
                    className="h-6 w-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400">@{formatUSD(item.basePrice)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Item Customizer Drawer / Modal */}
      {customizingItem && (
        <div className="border-t border-slate-200 bg-slate-50 p-3 space-y-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900">Customize: {customizingItem.name}</span>
            <button
              type="button"
              onClick={() => setCustomizingItem(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
            {/* Size */}
            <div className="flex gap-1">
              {(["Regular", "Large"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "UPDATE_CUSTOMIZATION", id: customizingItem.id, size: s });
                    setCustomizingItem((prev) => (prev ? { ...prev, size: s } : null));
                  }}
                  className={`flex-1 py-1 rounded-lg border transition-all cursor-pointer ${
                    customizingItem.size === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Sweetness */}
            <div className="flex gap-1">
              {(["0%", "50%", "100%"] as const).map((sw) => (
                <button
                  key={sw}
                  type="button"
                  onClick={() => {
                    dispatch({ type: "UPDATE_CUSTOMIZATION", id: customizingItem.id, sweetness: sw });
                    setCustomizingItem((prev) => (prev ? { ...prev, sweetness: sw } : null));
                  }}
                  className={`flex-1 py-1 rounded-lg border transition-all cursor-pointer ${
                    customizingItem.sweetness === sw
                      ? "bg-amber-500 text-slate-950 border-amber-500"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {sw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Panel: Bill Summary & Action Buttons */}
      <div className="border-t border-slate-200/80 bg-slate-50/80 p-3 space-y-2.5">
        {/* Bill Breakdown */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal</span>
            <span>{formatUSD(subtotalUSD)}</span>
          </div>

          {discountUSD > 0 && (
            <div className="flex justify-between text-amber-700 font-bold">
              <span>Discount</span>
              <span>-{formatUSD(discountUSD)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500 font-medium">
            <span>Tax (10%)</span>
            <span>{formatUSD(taxUSD)}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-1 font-black text-slate-900">
            <span className="text-sm">Total</span>
            <div className="text-right">
              <span className="text-base text-slate-950 block">{formatUSD(totalUSD)}</span>
              <span className="text-[11px] font-semibold text-slate-500">{formatKHR(totalUSD)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Action Mode */}
        {rightPanelMode === "actions" && (
          <div className="space-y-1.5">
            {/* Primary Payment Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setRightPanelMode("paymentChoice")}
                disabled={cart.length === 0}
                className="h-12 flex items-center justify-between px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Banknote size={18} />
                  <span>CASH</span>
                </div>
                <span className="text-[11px] font-black">${totalUSD.toFixed(2)}</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelMode("paymentChoice")}
                disabled={cart.length === 0}
                className="h-12 flex items-center justify-between px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-slate-900 transition-all shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <QrCode size={18} className="text-teal-400" />
                  <span>PAYMENT</span>
                </div>
                <span className="text-[10px] font-bold text-teal-300">KHQR / Card</span>
              </button>
            </div>

            {/* Utility Actions Row (2-Tab Navigation: Tab 0 = Qty/Promo/Hold/Next; Tab 1 = Back/Held/Shift/EndDay) */}
            {cartActionTab === 0 ? (
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenQtyNumpad}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <Hash size={12} className="text-amber-600" />
                  <span>Quantity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  disabled={cart.length === 0}
                  className={`flex h-9 items-center justify-center gap-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer shadow-2xs ${
                    discountUSD > 0
                      ? "bg-amber-100 border-amber-300 text-amber-900"
                      : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  }`}
                >
                  <Tag size={12} className={discountUSD > 0 ? "text-amber-700" : "text-slate-600"} />
                  <span>{discountUSD > 0 ? `-${formatUSD(discountUSD)}` : "Promo"}</span>
                </button>

                <button
                  type="button"
                  onClick={onHoldOrder}
                  disabled={cart.length === 0}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
                >
                  <PauseCircle size={12} />
                  <span>Hold</span>
                </button>

                {/* Next Tab Arrow */}
                <button
                  type="button"
                  onClick={() => setCartActionTab(1)}
                  title="Next Actions (End Shift, End Day)"
                  className="flex h-9 items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-right-2 duration-150">
                {/* Back Arrow */}
                <button
                  type="button"
                  onClick={() => setCartActionTab(0)}
                  title="Back to Order Actions"
                  className="flex h-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black active:scale-95 transition-all border border-slate-200 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Held Orders quick list */}
                <button
                  type="button"
                  onClick={onOpenHeldOrders}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200/80 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <PauseCircle size={12} className="text-amber-600" />
                  <span>Held ({heldOrders.length})</span>
                </button>

                {/* End Shift (1 day has 2 shifts) */}
                <button
                  type="button"
                  onClick={onOpenEndShift}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Moon size={12} />
                  <span>Shift {shift?.shiftNumber || 1}/2</span>
                </button>

                {/* End Day (Z-Close) */}
                <button
                  type="button"
                  onClick={onOpenEndDay}
                  className="flex h-9 items-center justify-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black active:scale-95 transition-all shadow-xs shadow-rose-600/20 cursor-pointer"
                >
                  <Calendar size={12} />
                  <span>End Day</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PAYMENT CHOICE FLOW */}
        {rightPanelMode === "paymentChoice" && (
          <PaymentChoiceModal
            totalUSD={totalUSD}
            onBack={() => setRightPanelMode("actions")}
            onCompletePayment={(details) => {
              onCompleteOrder(details);
              setRightPanelMode("actions");
              setDiscountUSD(0);
            }}
          />
        )}

        {/* QUANTITY NUMPAD */}
        {rightPanelMode === "qtyNumpad" && activeItem && (
          <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-1.5 h-10">
              <button
                type="button"
                onClick={() => setRightPanelMode("actions")}
                className="flex h-10 flex-1 items-center justify-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Cancel</span>
              </button>
              <div className="flex h-10 flex-1 items-center justify-center bg-amber-50 border border-amber-200 rounded-xl px-2">
                <span className="text-xs font-black text-amber-900 truncate">
                  Qty: {qtyInput || activeItem.qty}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQtyInput((p) => p + String(n))}
                  className="h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQtyInput("")}
                className="h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 transition-all flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setQtyInput((p) => (p ? p + "0" : "0"))}
                className="h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 shadow-2xs transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(qtyInput, 10);
                  if (val > 0) {
                    dispatch({ type: "UPDATE_QTY", id: activeItem.id, qty: val });
                  }
                  setRightPanelMode("actions");
                }}
                className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                <span>Apply</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Promo Code Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                <Tag size={14} className="text-amber-600" /> Apply Discount
              </span>
              <button
                type="button"
                onClick={() => setShowPromoModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "10% Off", val: subtotalUSD * 0.1 },
                { label: "20% Off", val: subtotalUSD * 0.2 },
                { label: "$1.00 Off", val: 1.0 },
                { label: "$2.00 Off", val: 2.0 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setDiscountUSD(Math.min(subtotalUSD, p.val));
                    setShowPromoModal(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 hover:text-amber-950 font-black text-xs text-center transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {discountUSD > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDiscountUSD(0);
                  setShowPromoModal(false);
                }}
                className="w-full py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Remove Current Discount
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
