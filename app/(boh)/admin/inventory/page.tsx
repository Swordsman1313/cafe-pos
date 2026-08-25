"use client";

import React, { useEffect, useState } from "react";
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  Droplets,
  Package,
  TrendingDown,
  ArrowRightLeft,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  ArrowDownToLine,
  RefreshCw,
  Send,
  Coffee,
  DollarSign,
  Sliders,
  Sparkles,
  UtensilsCrossed,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { exportToExcel, printExecutiveReport } from "@/lib/export-reports";

interface IngredientItem {
  id: string;
  name: string;
  category: "beans" | "dairy" | "syrup" | "disposable" | "other";
  currentStock: number;
  unit: string;
  reorderThreshold: number;
  maxCapacity: number;
  costPerUnit: number;
  supplierName: string;
}

interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  supplierName: string;
  invoiceNumber: string;
  receivedAt: string;
  receivedBy: string;
  paymentStatus: "PAID" | "PENDING_NET30" | "COD";
  totalAmountUSD: number;
  notes?: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    receivedQty: number;
    unit: string;
    unitCostUSD: number;
    totalCostUSD: number;
  }[];
}

interface WriteOffEntry {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costLossUSD: number;
  reason: string;
  reportedBy: string;
  timestamp: string;
  notes?: string;
}

interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceLocation: string;
  destinationLocation: string;
  transferredAt: string;
  transferredBy: string;
  status: string;
  notes?: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }[];
}

const DEMO_INGREDIENTS: IngredientItem[] = [
  { id: "i-01", name: "Ethiopia Yirgacheffe Beans", category: "beans", currentStock: 4800, unit: "g", reorderThreshold: 1000, maxCapacity: 8000, costPerUnit: 0.018, supplierName: "Cloud9 Coffee" },
  { id: "i-02", name: "Robusta Blend Beans", category: "beans", currentStock: 2200, unit: "g", reorderThreshold: 1000, maxCapacity: 6000, costPerUnit: 0.012, supplierName: "Cloud9 Coffee" },
  { id: "i-03", name: "House Espresso Blend", category: "beans", currentStock: 950, unit: "g", reorderThreshold: 1000, maxCapacity: 5000, costPerUnit: 0.015, supplierName: "Cloud9 Coffee" },
  { id: "i-04", name: "Whole Milk (Fresh)", category: "dairy", currentStock: 14, unit: "L", reorderThreshold: 8, maxCapacity: 30, costPerUnit: 1.20, supplierName: "Dairy Fresh Co." },
  { id: "i-05", name: "Oat Milk (Barista)", category: "dairy", currentStock: 6, unit: "L", reorderThreshold: 4, maxCapacity: 15, costPerUnit: 2.10, supplierName: "Oatly / Local" },
  { id: "i-06", name: "Soy Milk", category: "dairy", currentStock: 3, unit: "L", reorderThreshold: 2, maxCapacity: 10, costPerUnit: 1.80, supplierName: "Vitamilk" },
  { id: "i-07", name: "Vanilla Syrup", category: "syrup", currentStock: 1800, unit: "ml", reorderThreshold: 500, maxCapacity: 3000, costPerUnit: 0.003, supplierName: "Monin" },
  { id: "i-08", name: "Caramel Syrup", category: "syrup", currentStock: 420, unit: "ml", reorderThreshold: 500, maxCapacity: 3000, costPerUnit: 0.003, supplierName: "Monin" },
  { id: "i-09", name: "Hazelnut Syrup", category: "syrup", currentStock: 1200, unit: "ml", reorderThreshold: 500, maxCapacity: 3000, costPerUnit: 0.003, supplierName: "Monin" },
  { id: "i-10", name: "12oz Hot Cups", category: "disposable", currentStock: 340, unit: "pcs", reorderThreshold: 100, maxCapacity: 1000, costPerUnit: 0.08, supplierName: "PackageOne" },
  { id: "i-11", name: "16oz Cold Cups", category: "disposable", currentStock: 85, unit: "pcs", reorderThreshold: 100, maxCapacity: 800, costPerUnit: 0.09, supplierName: "PackageOne" },
];

import { useSearchParams } from "next/navigation";

export default function InventorySuitePage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading stock operations...</div>}>
      <InventorySuiteContent />
    </React.Suspense>
  );
}

function InventorySuiteContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as any;
  const [activeTab, setActiveTab] = useState<"stock" | "grn" | "adjustments" | "transfers" | "writeoffs">(
    initialTab && ["stock", "grn", "transfers", "writeoffs"].includes(initialTab) ? initialTab : "stock"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as any;
    if (tabParam && ["stock", "grn", "transfers", "writeoffs"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [ingredients, setIngredients] = useState<IngredientItem[]>(DEMO_INGREDIENTS);
  const [grnList, setGrnList] = useState<GoodsReceivedNote[]>([]);
  const [writeOffList, setWriteOffList] = useState<WriteOffEntry[]>([]);
  const [transferList, setTransferList] = useState<StockTransfer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);

  // GRN Form
  const [grnSupplier, setGrnSupplier] = useState("Cloud9 Coffee Importers");
  const [grnInvoice, setGrnInvoice] = useState("");
  const [grnPayment, setGrnPayment] = useState<"PAID" | "PENDING_NET30" | "COD">("PAID");
  const [grnIngredient, setGrnIngredient] = useState("Ethiopia Yirgacheffe Beans");
  const [grnQty, setGrnQty] = useState(5000);
  const [grnUnit, setGrnUnit] = useState("g");
  const [grnUnitCost, setGrnUnitCost] = useState(0.018);

  // Transfer Form
  const [trfFrom, setTrfFrom] = useState("CENTRAL_WAREHOUSE");
  const [trfTo, setTrfTo] = useState("MAIN_BARISTA_COUNTER");
  const [trfIngredient, setTrfIngredient] = useState("House Espresso Blend");
  const [trfQty, setTrfQty] = useState(2000);
  const [trfUnit, setTrfUnit] = useState("g");

  // Write-Off Form
  const [woIngredient, setWoIngredient] = useState("Whole Milk (Fresh)");
  const [woQty, setWoQty] = useState(1.0);
  const [woUnit, setWoUnit] = useState("L");
  const [woReason, setWoReason] = useState("SPOILAGE_EXPIRED");
  const [woNotes, setWoNotes] = useState("Opened carton sour");

  const fetchData = async () => {
    try {
      const grnRes = await fetch("/api/inventory/grn");
      const grnJson = await grnRes.json();
      if (grnJson.success) setGrnList(grnJson.grnRecords);

      const woRes = await fetch("/api/inventory/write-offs");
      const woJson = await woRes.json();
      if (woJson.success) setWriteOffList(woJson.writeOffs);

      const trfRes = await fetch("/api/inventory/transfers");
      const trfJson = await trfRes.json();
      if (trfJson.success) setTransferList(trfJson.transfers);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/inventory/grn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: grnSupplier,
          invoiceNumber: grnInvoice,
          paymentStatus: grnPayment,
          items: [
            {
              ingredientId: "i-custom",
              ingredientName: grnIngredient,
              receivedQty: Number(grnQty),
              unit: grnUnit,
              unitCostUSD: Number(grnUnitCost),
              totalCostUSD: Number((grnQty * grnUnitCost).toFixed(2)),
            },
          ],
        }),
      });
      setShowGrnModal(false);
      fetchData();
    } catch (e: any) {
      alert("Error saving GRN: " + e.message);
    }
  };

  const handleCreateWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/inventory/write-offs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientName: woIngredient,
          quantity: Number(woQty),
          unit: woUnit,
          costLossUSD: Number((woQty * 1.5).toFixed(2)),
          reason: woReason,
          notes: woNotes,
        }),
      });
      setShowWriteOffModal(false);
      fetchData();
    } catch (e: any) {
      alert("Error saving write-off: " + e.message);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocation: trfFrom,
          destinationLocation: trfTo,
          items: [
            {
              ingredientId: "i-custom",
              ingredientName: trfIngredient,
              quantity: Number(trfQty),
              unit: trfUnit,
            },
          ],
        }),
      });
      setShowTransferModal(false);
      fetchData();
    } catch (e: any) {
      alert("Error saving transfer: " + e.message);
    }
  };

  // Export Handlers
  const handleExportStockXLS = () => {
    const columns = [
      { header: "Ingredient ID", key: "id" },
      { header: "Ingredient Name", key: "name" },
      { header: "Category", key: "category" },
      { header: "Current Stock", key: "currentStock" },
      { header: "UOM Unit", key: "unit" },
      { header: "Reorder Threshold", key: "reorderThreshold" },
      { header: "Unit Cost ($)", key: "costPerUnit", format: (v: any) => `$${Number(v).toFixed(3)}` },
      { header: "Total Valuation ($)", key: "val", format: (v: any) => `$${Number(v).toFixed(2)}` },
      { header: "Supplier", key: "supplierName" },
    ];
    const data = ingredients.map((i) => ({
      ...i,
      val: i.currentStock * i.costPerUnit,
    }));
    const totalVal = data.reduce((a, b) => a + b.val, 0);
    exportToExcel("Live_Stock_Inventory_Valuation", [
      {
        sheetName: "Raw Ingredients",
        columns,
        data,
        summary: { id: "TOTAL", name: "Total Valuation", currentStock: "", costPerUnit: "", val: `$${totalVal.toFixed(2)}` },
      },
    ]);
  };

  const handleExportStockPDF = () => {
    const data = ingredients.map((i) => ({
      ...i,
      val: i.currentStock * i.costPerUnit,
    }));
    const totalVal = data.reduce((a, b) => a + b.val, 0);
    printExecutiveReport({
      title: "Raw Material & Ingredient Inventory Valuation",
      subtitle: "Live stock count across Espresso Bar, Kitchen, and Central Storage",
      dateRangeLabel: "Live Snapshot (" + new Date().toLocaleDateString() + ")",
      kpis: [
        { label: "Total Inventory Value", value: `$${totalVal.toFixed(2)}`, sublabel: `${(totalVal * 4000).toLocaleString()} ៛` },
        { label: "Total Tracked Items", value: String(ingredients.length), sublabel: "SKUs in system" },
        { label: "Low Stock Items", value: String(ingredients.filter((i) => i.currentStock <= i.reorderThreshold).length), sublabel: "Requires reorder" },
      ],
      columns: [
        { header: "Item Name", key: "name", align: "left" },
        { header: "Category", key: "category", align: "left" },
        { header: "Stock", key: "currentStock", align: "center", format: (v) => `${v}` },
        { header: "Unit", key: "unit", align: "center" },
        { header: "Cost/Unit", key: "costPerUnit", align: "right", format: (v) => `$${Number(v).toFixed(3)}` },
        { header: "Valuation", key: "val", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
        { header: "Supplier", key: "supplierName", align: "left" },
      ],
      data,
      summaryRow: {
        name: "Grand Total Valuation",
        category: "—",
        currentStock: "",
        unit: "—",
        costPerUnit: "—",
        val: `$${totalVal.toFixed(2)}`,
        supplierName: "—",
      },
    });
  };

  const handleExportGRNXLS = () => {
    const columns = [
      { header: "GRN #", key: "grnNumber" },
      { header: "Supplier", key: "supplierName" },
      { header: "Invoice #", key: "invoiceNumber" },
      { header: "Date Received", key: "receivedAt" },
      { header: "Total Amount ($)", key: "totalAmountUSD", format: (v: any) => `$${Number(v || 0).toFixed(2)}` },
      { header: "Payment Status", key: "paymentStatus" },
    ];
    exportToExcel("Goods_Received_GRN_Report", [
      {
        sheetName: "GRN Receipts",
        columns,
        data: grnList,
        summary: { grnNumber: "TOTAL", supplierName: "", totalAmountUSD: `$${grnList.reduce((a, b) => a + (b.totalAmountUSD || 0), 0).toFixed(2)}` },
      },
    ]);
  };

  const handleExportGRNPDF = () => {
    const totalCost = grnList.reduce((a, b) => a + (b.totalAmountUSD || 0), 0);
    printExecutiveReport({
      title: "Goods Received (GRN) Invoices & Purchasing Audit",
      subtitle: "Verified supplier shipments, batch invoices, and receipt statuses",
      dateRangeLabel: "Recent Receiving Records",
      kpis: [
        { label: "Total Purchases Received", value: `$${totalCost.toFixed(2)}`, sublabel: `${(totalCost * 4000).toLocaleString()} ៛` },
        { label: "Shipments Logged", value: String(grnList.length), sublabel: "GRN Receipts" },
      ],
      columns: [
        { header: "GRN Ref", key: "grnNumber", align: "left" },
        { header: "Supplier", key: "supplierName", align: "left" },
        { header: "Invoice #", key: "invoiceNumber", align: "left" },
        { header: "Date Received", key: "receivedAt", align: "center", format: (v) => new Date(v).toLocaleDateString() },
        { header: "Status", key: "paymentStatus", align: "center" },
        { header: "Total Amount", key: "totalAmountUSD", align: "right", format: (v) => `$${Number(v || 0).toFixed(2)}` },
      ],
      data: grnList,
      summaryRow: {
        grnNumber: "TOTAL",
        supplierName: "Grand Total Receipts",
        invoiceNumber: "—",
        receivedAt: "—",
        paymentStatus: "—",
        totalAmountUSD: `$${totalCost.toFixed(2)}`,
      },
    });
  };

  const handleExportTransfersXLS = () => {
    const columns = [
      { header: "Transfer #", key: "transferNumber" },
      { header: "Source", key: "sourceLocation" },
      { header: "Destination", key: "destinationLocation" },
      { header: "Transferred By", key: "transferredBy" },
      { header: "Status", key: "status" },
      { header: "Date", key: "transferredAt" },
    ];
    exportToExcel("Stock_Transfers_Report", [{ sheetName: "Transfers", columns, data: transferList }]);
  };

  const handleExportWasteXLS = () => {
    const columns = [
      { header: "Item Name", key: "ingredientName" },
      { header: "Quantity Lost", key: "quantity" },
      { header: "Unit", key: "unit" },
      { header: "Cost Loss ($)", key: "costLossUSD", format: (v: any) => `$${Number(v).toFixed(2)}` },
      { header: "Reason", key: "reason" },
      { header: "Logged By", key: "reportedBy" },
      { header: "Date", key: "timestamp" },
    ];
    const totalLoss = writeOffList.reduce((a, b) => a + b.costLossUSD, 0);
    exportToExcel("Waste_Spoilage_WriteOff_Report", [
      {
        sheetName: "Waste Log",
        columns,
        data: writeOffList,
        summary: { ingredientName: "TOTAL LOSS", quantity: "", unit: "", costLossUSD: `$${totalLoss.toFixed(2)}` },
      },
    ]);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
      {/* ── CONTEXTUAL HEADER PER ACTIVE OPERATION ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {activeTab === "stock" && (
              <>
                <Boxes size={22} className="text-amber-500" />
                <span>Live Raw Stock &amp; UOM Inventory</span>
              </>
            )}
            {activeTab === "grn" && (
              <>
                <ArrowDownToLine size={22} className="text-emerald-500" />
                <span>Goods Received Notes (GRN) &amp; Supplier Invoices</span>
              </>
            )}
            {activeTab === "transfers" && (
              <>
                <ArrowRightLeft size={22} className="text-blue-500" />
                <span>Inter-Station Stock Transfers</span>
              </>
            )}
            {activeTab === "writeoffs" && (
              <>
                <AlertTriangle size={22} className="text-rose-500" />
                <span>Waste, Calibration &amp; Spoilage Write-Offs</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === "stock" && "Real-time raw ingredient tracking, unit of measurements, reorder thresholds, and current stock valuation"}
            {activeTab === "grn" && "Log supplier delivery shipments, invoice numbers, purchase costs, and automated stock increases"}
            {activeTab === "transfers" && "Track raw inventory movements between Central Warehouse, Barista Counter, and Kitchen stations"}
            {activeTab === "writeoffs" && "Audit waste, milk spoilage, calibration grind loss, and calculate exact financial write-off costs"}
          </p>
        </div>

        {/* Action & Export Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === "stock" && (
            <>
              <button
                onClick={handleExportStockXLS}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export XLS</span>
              </button>
              <button
                onClick={handleExportStockPDF}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <Printer size={15} />
                <span>Print PDF</span>
              </button>
            </>
          )}

          {activeTab === "grn" && (
            <>
              <button
                onClick={handleExportGRNXLS}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export XLS</span>
              </button>
              <button
                onClick={handleExportGRNPDF}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Printer size={15} />
                <span>Print PDF</span>
              </button>
              <button
                onClick={() => setShowGrnModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <ArrowDownToLine size={15} />
                <span>+ Receive GRN</span>
              </button>
            </>
          )}

          {activeTab === "transfers" && (
            <>
              <button
                onClick={handleExportTransfersXLS}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export XLS</span>
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <ArrowRightLeft size={15} />
                <span>+ New Transfer</span>
              </button>
            </>
          )}

          {activeTab === "writeoffs" && (
            <>
              <button
                onClick={handleExportWasteXLS}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export XLS</span>
              </button>
              <button
                onClick={() => setShowWriteOffModal(true)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-3.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <AlertTriangle size={15} />
                <span>+ Log Waste / Spoilage</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TAB 1: LIVE STOCK ── */}
      {activeTab === "stock" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients.map((ing) => {
              const pct = (ing.currentStock / ing.maxCapacity) * 100;
              const isLow = ing.currentStock <= ing.reorderThreshold;
              return (
                <div
                  key={ing.id}
                  className={`p-4 rounded-3xl bg-white dark:bg-slate-900/90 border transition-all space-y-3 shadow-sm ${
                    isLow ? "border-amber-500/50 shadow-amber-500/10" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Package size={17} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{ing.name}</h4>
                        <p className="text-[10px] text-slate-400">Supplier: {ing.supplierName}</p>
                      </div>
                    </div>
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                        Low Stock
                      </span>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Current Stock:</span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {ing.currentStock.toLocaleString("en-US")} {ing.unit}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLow ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Reorder: {ing.reorderThreshold} {ing.unit}</span>
                      <span>Max: {ing.maxCapacity} {ing.unit}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Unit Cost:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${ing.costPerUnit} / {ing.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: GOODS RECEIVED NOTES (GRN) ── */}
      {activeTab === "grn" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">GRN # &amp; Date</th>
                  <th className="px-4 py-3.5">Supplier &amp; Invoice</th>
                  <th className="px-4 py-3.5">Received Items</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {grnList.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white font-mono">{grn.grnNumber}</p>
                      <p className="text-[10px] text-slate-400">{grn.receivedAt}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{grn.supplierName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{grn.invoiceNumber}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {grn.items.map((it, i) => (
                        <div key={i} className="text-slate-700 dark:text-slate-300 text-[11px]">
                          {it.receivedQty.toLocaleString("en-US")} {it.unit} · {it.ingredientName}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${grn.totalAmountUSD.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {grn.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{grn.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: STOCK TRANSFERS ── */}
      {activeTab === "transfers" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Transfer #</th>
                  <th className="px-4 py-3.5">Route (From → To)</th>
                  <th className="px-4 py-3.5">Items Transferred</th>
                  <th className="px-4 py-3.5">Transferred By</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {transferList.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white font-mono">{trf.transferNumber}</p>
                      <p className="text-[10px] text-slate-400">{trf.transferredAt}</p>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {trf.sourceLocation.replace(/_/g, " ")} → {trf.destinationLocation.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3.5">
                      {trf.items.map((it, i) => (
                        <div key={i} className="text-slate-700 dark:text-slate-300 text-[11px]">
                          {it.quantity} {it.unit} · {it.ingredientName}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{trf.transferredBy}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {trf.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: WASTE & WRITE-OFFS ── */}
      {activeTab === "writeoffs" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Time &amp; Ingredient</th>
                  <th className="px-4 py-3.5">Waste Quantity</th>
                  <th className="px-4 py-3.5">Cost Loss ($)</th>
                  <th className="px-4 py-3.5">Reason &amp; Remarks</th>
                  <th className="px-4 py-3.5">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {writeOffList.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{wo.ingredientName}</p>
                      <p className="text-[10px] text-slate-400">{wo.timestamp}</p>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">
                      {wo.quantity} {wo.unit}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-rose-600 dark:text-rose-300 font-bold">
                      -${wo.costLossUSD.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {wo.reason.replace(/_/g, " ")}
                      </span>
                      {wo.notes && <p className="text-[10px] text-slate-400 mt-1">{wo.notes}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{wo.reportedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {showGrnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownToLine size={18} className="text-emerald-500" />
                <span>Receive Supplier Delivery (GRN)</span>
              </h2>
              <button onClick={() => setShowGrnModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateGRN} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Supplier Name *</label>
                <input required value={grnSupplier} onChange={(e) => setGrnSupplier(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Invoice #</label>
                  <input value={grnInvoice} onChange={(e) => setGrnInvoice(e.target.value)} placeholder="INV-2026-01" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Payment Status</label>
                  <select value={grnPayment} onChange={(e: any) => setGrnPayment(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500">
                    <option value="PAID">PAID</option>
                    <option value="PENDING_NET30">NET 30</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">Received Item</span>
                <input value={grnIngredient} onChange={(e) => setGrnIngredient(e.target.value)} placeholder="Ingredient Name" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={grnQty} onChange={(e) => setGrnQty(Number(e.target.value))} placeholder="Qty" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white" />
                  <input value={grnUnit} onChange={(e) => setGrnUnit(e.target.value)} placeholder="Unit" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white" />
                  <input type="number" step="0.001" value={grnUnitCost} onChange={(e) => setGrnUnitCost(Number(e.target.value))} placeholder="Cost/Unit" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="flex-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Save Inward GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-sky-500" />
                <span>Inter-Station Stock Transfer</span>
              </h2>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Source (From)</label>
                  <select value={trfFrom} onChange={(e) => setTrfFrom(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-900 dark:text-white">
                    <option value="CENTRAL_WAREHOUSE">Central Storage</option>
                    <option value="MAIN_BARISTA_COUNTER">Barista Counter</option>
                    <option value="BAKERY_SECTION">Bakery Display</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Destination (To)</label>
                  <select value={trfTo} onChange={(e) => setTrfTo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-900 dark:text-white">
                    <option value="MAIN_BARISTA_COUNTER">Barista Counter</option>
                    <option value="CENTRAL_WAREHOUSE">Central Storage</option>
                    <option value="BAKERY_SECTION">Bakery Display</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Item to Transfer</label>
                <input value={trfIngredient} onChange={(e) => setTrfIngredient(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={trfQty} onChange={(e) => setTrfQty(Number(e.target.value))} placeholder="Qty" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
                <input value={trfUnit} onChange={(e) => setTrfUnit(e.target.value)} placeholder="Unit" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="flex-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold">Transfer Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waste Modal */}
      {showWriteOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" />
                <span>Log Stock Waste &amp; Write-Off</span>
              </h2>
              <button onClick={() => setShowWriteOffModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateWriteOff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Item / Ingredient</label>
                <input value={woIngredient} onChange={(e) => setWoIngredient(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.1" value={woQty} onChange={(e) => setWoQty(Number(e.target.value))} placeholder="Qty" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
                <input value={woUnit} onChange={(e) => setWoUnit(e.target.value)} placeholder="Unit" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Reason for Write-Off</label>
                <select value={woReason} onChange={(e) => setWoReason(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-900 dark:text-white">
                  <option value="SPOILAGE_EXPIRED">Spoilage / Expired</option>
                  <option value="GRINDER_CALIBRATION">Grinder Calibration Waste</option>
                  <option value="SPILLAGE_ACCIDENT">Spillage / Accident During Rush</option>
                  <option value="STAFF_TRAINING">Staff Training / Tasting</option>
                  <option value="DAMAGED_TRANSIT">Damaged in Transit</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-400 font-bold mb-1">Remarks</label>
                <input value={woNotes} onChange={(e) => setWoNotes(e.target.value)} placeholder="e.g. Broken container" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowWriteOffModal(false)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">Cancel</button>
                <button type="submit" className="flex-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">Submit Waste Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
