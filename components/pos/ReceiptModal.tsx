"use client";

import React, { useRef } from "react";
import { CheckCircle2, Printer, Plus, X } from "lucide-react";

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
  storeName = "ON MART TOUL KORK 592",
  storeAddressKhmer = "ដីឡូត៍លេខ០១ ផ្លូវ៥៩២ កែងផ្លូវ៣០៦ បឹងកក់ទី២ ទួលគោក រាជធានីភ្នំពេញ",
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
  // Extract number for big queue display (e.g. "T-269" -> "269" or "31")
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
                Commercial Invoice #{order.ticketNumber}
              </h2>
              <p className="text-[10px] font-semibold text-emerald-700">Payment Confirmed · {order.paymentMethod}</p>
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

        {/* ── THERMAL RECEIPT SLIP CONTAINER (Exact Monakom POS Standard) ── */}
        <div className="overflow-y-auto pr-0.5 flex-1 min-h-0 bg-stone-100/70 p-2 sm:p-3 rounded-2xl border border-stone-200/80">
          <div
            ref={receiptRef}
            id="monakom-thermal-receipt"
            className="w-full bg-white text-stone-950 p-4 sm:p-5 shadow-sm rounded-xl font-mono text-[11px] leading-relaxed border border-stone-200/60 mx-auto"
            style={{ maxWidth: "340px" }}
          >
            {/* 1. Header Logo & Khmer Branding */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-stone-300">
              <div className="inline-flex flex-col items-center justify-center">
                {/* Monakom / ON MART Style Logo Badge */}
                <div className="h-10 px-3 rounded-lg bg-black text-white font-black tracking-tighter text-base flex items-center justify-center leading-none">
                  ON MART
                </div>
              </div>
              <div className="font-sans font-bold text-xs text-stone-900 tracking-tight mt-1">
                អរគុណ ប្រេីប្រាស់
              </div>
              <div className="text-[10px] text-stone-600 font-sans">
                លេខអត្តសញ្ញាណកម្ម (VATTIN) : <span className="font-semibold">{vattin}</span>
              </div>
              <div className="text-[9.5px] text-stone-500 font-sans leading-tight px-1">
                {storeAddressKhmer}
              </div>
            </div>

            {/* 2. Receipt Title */}
            <div className="text-center py-2 border-b border-dashed border-stone-300 font-sans font-black text-xs text-stone-900 tracking-wide uppercase">
              វិក្កយបត្រ / COMMERCIAL INVOICE
            </div>

            {/* 3. Key-Value Metadata */}
            <div className="py-2 border-b border-dashed border-stone-300 space-y-0.5 text-[10.5px]">
              <div className="flex">
                <span className="w-36 text-stone-600 font-sans">សាខា / Store</span>
                <span className="font-semibold text-stone-900">: {storeName}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-stone-600 font-sans">កាលបរិច្ឆេទ / Date</span>
                <span className="font-semibold text-stone-900">: {order.timestamp || new Date().toLocaleString()}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-stone-600 font-sans">អ្នកគិតលុយ / Cashier</span>
                <span className="font-semibold text-stone-900">: {order.cashierName || "swordsman"}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-stone-600 font-sans">វិក្កយបត្រ / Invoice Number</span>
                <span className="font-semibold text-stone-900">: INV{displayQueueNumber.padStart(7, "0")}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-stone-600 font-sans">ប្រភេទកម្មង់ / Order Type</span>
                <span className="font-semibold text-stone-900">: Counter</span>
              </div>
            </div>

            {/* 4. Order Channel Banner */}
            <div className="text-center py-2 font-black font-sans text-sm tracking-wider uppercase text-stone-950 border-b border-dashed border-stone-300">
              {order.channel || "WALK-IN"}{order.table ? ` · TABLE ${order.table}` : ""}
            </div>

            {/* 5. Items Spreadsheet Table */}
            <div className="py-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-1 pb-1.5 mb-1.5 border-b border-dashed border-stone-300 font-sans font-black text-[10px] text-stone-800">
                <div className="col-span-5 text-left">
                  <div>មុខទំនិញ</div>
                  <div className="text-[8.5px] font-normal text-stone-500">Item Name</div>
                </div>
                <div className="col-span-3 text-right">
                  <div>តម្លៃ</div>
                  <div className="text-[8.5px] font-normal text-stone-500">Price</div>
                </div>
                <div className="col-span-2 text-center">
                  <div>ចំនួន</div>
                  <div className="text-[8.5px] font-normal text-stone-500">QTY</div>
                </div>
                <div className="col-span-2 text-right">
                  <div>សរុប</div>
                  <div className="text-[8.5px] font-normal text-stone-500">Total</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5">
                {order.items.map((item, idx) => {
                  const unitPrice = item.unitPrice ?? (item.price ?? (item.total / (item.qty || 1)));
                  const modText = item.modifiers || item.customization;
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-1 text-[10.5px] items-start">
                      <div className="col-span-5 text-left">
                        <div className="font-bold text-stone-900 leading-tight break-words">{item.name}</div>
                        {modText && (
                          <div className="text-[9px] text-stone-500 font-sans leading-tight mt-0.5 whitespace-normal break-words">
                            {modText}
                          </div>
                        )}
                      </div>
                      <div className="col-span-3 text-right text-stone-700">${unitPrice.toFixed(2)}</div>
                      <div className="col-span-2 text-center font-bold text-stone-900">x{item.qty}</div>
                      <div className="col-span-2 text-right font-black text-stone-950">${item.total.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Totals Breakdown */}
            <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="font-sans text-stone-600">សរុបបឋម / Sub Total</span>
                <span className="font-bold">${subtotalUSD.toFixed(2)}</span>
              </div>

              {discountUSD > 0 && (
                <div className="flex justify-between items-center text-amber-900 font-bold">
                  <span className="font-sans">បញ្ចុះតម្លៃ / Discount</span>
                  <span>-${discountUSD.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-stone-300 pt-1.5 mt-1 space-y-1">
                <div className="flex justify-between items-center font-black text-xs text-stone-950">
                  <span className="font-sans">សរុប / TOTAL (USD)</span>
                  <span>${totalUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-black text-xs text-stone-950">
                  <span className="font-sans">សរុប / TOTAL (KHR)</span>
                  <span>{totalKHR.toLocaleString("en-US")} ៛</span>
                </div>
              </div>

              <div className="border-t border-dashed border-stone-300 pt-1.5 mt-1 space-y-0.5 text-[10.5px]">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-stone-600">
                    ប្រាក់ទទួល / Received ({order.paymentMethod === "CASH" ? "KHR/USD" : order.paymentMethod})
                  </span>
                  <span className="font-bold text-stone-900">
                    {order.paymentMethod === "CASH"
                      ? `${totalKHR.toLocaleString("en-US")} ៛`
                      : `$${totalUSD.toFixed(2)}`}
                  </span>
                </div>

                {changeUSD > 0 && (
                  <div className="flex justify-between items-center text-emerald-800 font-bold">
                    <span className="font-sans">ប្រាក់អាប់ / Change</span>
                    <span>
                      ${changeUSD.toFixed(2)} / {changeKHR.toLocaleString("en-US")} ៛
                    </span>
                  </div>
                )}
              </div>

              {/* Tax & Exchange Note */}
              <div className="pt-2 text-center text-[9px] text-stone-500 font-sans leading-tight border-t border-dashed border-stone-300 mt-1.5">
                តម្លៃរួមបញ្ចូលទាំងអាករ / Incl. VAT 10% អត្រាប្តូរប្រាក់ / Exchange Rate $1 = KHR {exchangeRate.toLocaleString("en-US")}៛
              </div>
            </div>

            {/* 7. Huge Queue Ticket Number (Centered) */}
            <div className="text-center pt-3 pb-2 border-t border-dashed border-stone-400 mt-2">
              <div className="text-4xl font-black tracking-tight text-stone-950 leading-none">
                {displayQueueNumber}
              </div>
              <div className="font-sans font-bold text-[10px] text-stone-600 uppercase tracking-widest mt-1">
                លេខរង់ចាំ / TICKET
              </div>
            </div>

            {/* 8. Footer */}
            <div className="text-center pt-2 border-t border-dashed border-stone-300 text-[9.5px] font-sans font-bold text-stone-600">
              Powered by Monakom Technology
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

      {/* ── PRINT-ONLY STYLESHEET (Isolates thermal slip during print) ── */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #monakom-thermal-receipt,
          #monakom-thermal-receipt * {
            visibility: visible;
          }
          #monakom-thermal-receipt {
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
