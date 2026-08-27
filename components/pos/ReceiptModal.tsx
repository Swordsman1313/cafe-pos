"use client";

import React, { useRef } from "react";
import { CheckCircle2, Printer, Plus, X, Coffee } from "lucide-react";

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice?: number;
  price?: number;
  total: number;
  modifiers?: string;
  customization?: string;
}

export interface ReceiptOrder {
  id?: string;
  ticketNumber: string;
  timestamp: string;
  items: ReceiptItem[];
  subtotal: number;
  discountUSD?: number;
  tax: number;
  total: number;
  totalReceivedUSD?: number;
  receivedUSD?: string;
  receivedKHR?: string;
  changeUSD?: number;
  changeKHR?: number;
  paymentMethod: string;
  channel?: string;
  table?: string;
  customerName?: string;
  cashierName?: string;
  status?: string;
  voidReason?: string;
}

export interface ReceiptModalProps {
  order: ReceiptOrder | null;
  onNewOrder: () => void;
  onClose?: () => void;
  storeName?: string;
  storeAddressKhmer?: string;
  vattin?: string;
  exchangeRate?: number;
}

export function ReceiptModal({
  order,
  onNewOrder,
  onClose,
  storeName = "The Daily Drip — Toul Kork",
  storeAddressKhmer = "ផ្លូវ៥៩២ កែងផ្លូវ៣០៦ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ",
  vattin = "L001-901503056",
  exchangeRate = 4100,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const totalUSD = order.total || 0;
  const totalKHR = Math.round(totalUSD * exchangeRate);
  const subtotalUSD = order.subtotal || order.items.reduce((s, i) => s + (i.total || 0), 0);
  const discountUSD = order.discountUSD || 0;
  const changeUSD = order.changeUSD || 0;
  const changeKHR = order.changeKHR || Math.round(changeUSD * exchangeRate);

  const rawTicket = order.ticketNumber || "01";
  const displayQueueNumber = rawTicket.replace(/^[^\d]*/, "") || rawTicket;

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error("Print failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto max-h-[95vh] flex flex-col justify-between animate-in zoom-in-95 duration-200">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                Order #{order.ticketNumber} Completed
              </h2>
              <p className="text-[10px] font-semibold text-emerald-700">Receipt Ready · {order.paymentMethod}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose || onNewOrder}
            className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── THE DAILY DRIP THERMAL RECEIPT SLIP ── */}
        <div className="overflow-y-auto pr-0.5 flex-1 min-h-0 bg-stone-100/70 p-2 sm:p-3 rounded-2xl border border-stone-200/80">
          <div
            ref={receiptRef}
            id="daily-drip-thermal-receipt"
            className="w-full bg-white text-stone-950 p-4 sm:p-5 shadow-sm rounded-xl font-mono text-[11px] leading-relaxed border border-stone-200/60 mx-auto"
            style={{ maxWidth: "340px" }}
          >
            {/* 1. Header & Brand Identity */}
            <div className="text-center space-y-1 pb-2.5 border-b-2 border-stone-800">
              <div className="flex items-center justify-center gap-1.5 text-stone-900">
                <Coffee size={18} className="text-[#4A2E1F] stroke-[2.5]" />
                <span className="font-sans font-black text-base tracking-tight uppercase">
                  THE DAILY DRIP
                </span>
              </div>
              <div className="text-[9.5px] font-sans font-semibold tracking-wider uppercase text-amber-900">
                Specialty Coffee &amp; Artisan Bakery
              </div>
              <div className="text-[9.5px] text-stone-600 font-sans">
                VATTIN (លេខអត្តសញ្ញាណកម្ម): <span className="font-semibold text-stone-800">{vattin}</span>
              </div>
              <div className="text-[9px] text-stone-500 font-sans leading-tight px-1">
                {storeAddressKhmer}
              </div>
            </div>

            {/* 2. Receipt Title Banner */}
            <div className="text-center py-1.5 border-b border-dashed border-stone-300 font-sans font-black text-[11.5px] text-stone-900 tracking-wider uppercase">
              OFFICIAL RECEIPT / វិក្កយបត្រ
            </div>

            {/* 3. Transaction Details */}
            <div className="py-2 border-b border-dashed border-stone-300 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Store / សាខា:</span>
                <span className="font-semibold text-stone-900">{storeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Date / កាលបរិច្ឆេទ:</span>
                <span className="font-semibold text-stone-900">{order.timestamp || new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Cashier / បេឡា:</span>
                <span className="font-semibold text-stone-900">{order.cashierName || "Dara"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Invoice # / លេខ:</span>
                <span className="font-semibold text-stone-900">#DD-{displayQueueNumber.padStart(6, "0")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">Order Type / ប្រភេទ:</span>
                <span className="font-bold text-stone-900 uppercase">
                  {order.channel || "Walk-In"}{order.table ? ` (Table ${order.table})` : ""}
                </span>
              </div>
            </div>

            {/* 4. Items Table */}
            <div className="py-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-1 pb-1 mb-1.5 border-b border-stone-300 font-sans font-black text-[9.5px] text-stone-700 uppercase">
                <div className="col-span-6 text-left">ITEM / មុខទំនិញ</div>
                <div className="col-span-2 text-right">PRICE</div>
                <div className="col-span-2 text-center">QTY</div>
                <div className="col-span-2 text-right">TOTAL</div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                {order.items.map((item, idx) => {
                  const unitPrice = item.unitPrice ?? (item.price ?? (item.total / (item.qty || 1)));
                  const modText = item.modifiers || item.customization;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-1 text-[10.5px] items-start">
                      <div className="col-span-6 text-left">
                        <div className="font-bold text-stone-900 leading-tight break-words">{item.name}</div>
                        {modText && (
                          <div className="text-[9px] text-stone-500 font-sans leading-tight mt-0.5 whitespace-normal break-words">
                            • {modText}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-stone-600">${unitPrice.toFixed(2)}</div>
                      <div className="col-span-2 text-center font-bold text-stone-900">x{item.qty}</div>
                      <div className="col-span-2 text-right font-black text-stone-950">${item.total.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Financial Summary */}
            <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-[10.5px]">
              <div className="flex justify-between items-center text-stone-600">
                <span>Subtotal / សរុបបឋម</span>
                <span className="font-bold text-stone-800">${subtotalUSD.toFixed(2)}</span>
              </div>

              {discountUSD > 0 && (
                <div className="flex justify-between items-center text-amber-900 font-bold">
                  <span>Discount Promo / បញ្ចុះតម្លៃ</span>
                  <span>-${discountUSD.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-stone-500 text-[10px]">
                <span>Tax VAT (10% Included)</span>
                <span className="font-semibold">${(order.tax || (totalUSD * 0.1)).toFixed(2)}</span>
              </div>

              {/* Highlighted Total Box */}
              <div className="border-t-2 border-b-2 border-stone-900 py-1.5 my-1 space-y-0.5">
                <div className="flex justify-between items-center font-black text-xs text-stone-950">
                  <span className="font-sans uppercase">TOTAL (USD)</span>
                  <span className="text-sm">${totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-black text-xs text-amber-950">
                  <span className="font-sans uppercase">TOTAL (KHR)</span>
                  <span>{totalKHR.toLocaleString("en-US")} ៛</span>
                </div>
              </div>

              {/* Payment Tender & Change */}
              <div className="space-y-0.5 text-[10px] text-stone-700 pt-0.5">
                <div className="flex justify-between items-center">
                  <span>Paid with {order.paymentMethod}</span>
                  <span className="font-bold text-stone-900">
                    {order.paymentMethod === "CASH"
                      ? `${totalKHR.toLocaleString("en-US")} ៛ ($${totalUSD.toFixed(2)})`
                      : `$${totalUSD.toFixed(2)}`}
                  </span>
                </div>

                {changeUSD > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-bold">
                    <span>Change Given / ប្រាក់អាប់</span>
                    <span>
                      ${changeUSD.toFixed(2)} / {changeKHR.toLocaleString("en-US")} ៛
                    </span>
                  </div>
                )}
              </div>

              {/* Rate & Tax Footnote */}
              <div className="pt-1.5 text-center text-[8.5px] text-stone-500 font-sans leading-tight border-t border-dashed border-stone-300 mt-1">
                Exchange Rate: $1.00 = {exchangeRate.toLocaleString("en-US")} ៛ · All Prices Include 10% VAT
              </div>
            </div>

            {/* 6. Distinctive Queue Token Box */}
            <div className="text-center pt-2.5 pb-1.5 border-2 border-dashed border-stone-800 rounded-xl my-2.5 bg-stone-50/50">
              <div className="text-[9px] font-sans font-bold text-stone-600 uppercase tracking-wider">
                QUEUE TICKET / លេខរង់ចាំ
              </div>
              <div className="text-3xl font-black tracking-tight text-stone-950 leading-tight mt-0.5">
                #{displayQueueNumber}
              </div>
            </div>

            {/* 7. Unique Daily Drip Brand Footer */}
            <div className="text-center pt-1.5 text-[9px] font-sans text-stone-500 space-y-0.5">
              <div className="font-bold text-stone-700">Thank you for visiting The Daily Drip!</div>
              <div>Enjoy your fresh handcrafted coffee ☕</div>
              <div className="text-[8px] text-stone-400 font-mono pt-1">www.thedailydrip.cafe</div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={onNewOrder}
            className="flex-1 py-3 rounded-2xl bg-[#4A2E1F] hover:bg-[#3d2417] text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Order →</span>
          </button>
        </div>
      </div>

      {/* ── PRINT-ONLY STYLESHEET ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #daily-drip-thermal-receipt,
          #daily-drip-thermal-receipt * {
            visibility: visible;
          }
          #daily-drip-thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11px !important;
            color: #000000 !important;
            background: #ffffff !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
