"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  X,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Layers,
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
} from "lucide-react";
import { exportToExcel, printExecutiveReport, ReportKPI, ReportColumn } from "@/lib/export-reports";

interface CustomReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType?: "sales" | "shifts" | "inventory" | "grn";
  isLight?: boolean;
}

export default function CustomReportModal({
  isOpen,
  onClose,
  reportType = "sales",
  isLight = false,
}: CustomReportModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7days" | "30days" | "custom">("today");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (!isOpen) return null;

  const handlePresetChange = (preset: "today" | "yesterday" | "7days" | "30days" | "custom") => {
    setDatePreset(preset);
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      setStartDate(yesterdayStr);
      setEndDate(yesterdayStr);
    } else if (preset === "7days") {
      setStartDate(sevenDaysAgoStr);
      setEndDate(todayStr);
    } else if (preset === "30days") {
      setStartDate(thirtyDaysAgoStr);
      setEndDate(todayStr);
    }
  };

  // Mock / Calculated data for report based on range
  const multiplier = datePreset === "yesterday" ? 0.92 : datePreset === "7days" ? 6.8 : datePreset === "30days" ? 28.5 : 1.0;

  const demoSalesItems = [
    { code: "PRD-01", name: "Cambodian Iced Coffee", category: "Iced", qty: Math.round(38 * multiplier), unitPrice: 3.50, revenue: 38 * multiplier * 3.50, cogsUnit: 0.85, totalCogs: 38 * multiplier * 0.85 },
    { code: "PRD-02", name: "Espresso Tonic", category: "Specialty", qty: Math.round(27 * multiplier), unitPrice: 4.00, revenue: 27 * multiplier * 4.00, cogsUnit: 1.10, totalCogs: 27 * multiplier * 1.10 },
    { code: "PRD-03", name: "Oat Milk Latte", category: "Hot", qty: Math.round(24 * multiplier), unitPrice: 4.50, revenue: 24 * multiplier * 4.50, cogsUnit: 1.45, totalCogs: 24 * multiplier * 1.45 },
    { code: "PRD-04", name: "Cold Brew Float", category: "Iced", qty: Math.round(19 * multiplier), unitPrice: 5.00, revenue: 19 * multiplier * 5.00, cogsUnit: 1.20, totalCogs: 19 * multiplier * 1.20 },
    { code: "PRD-05", name: "Matcha Latte", category: "Specialty", qty: Math.round(15 * multiplier), unitPrice: 5.50, revenue: 15 * multiplier * 5.50, cogsUnit: 1.60, totalCogs: 15 * multiplier * 1.60 },
    { code: "PRD-06", name: "Croissant Breakfast Combo", category: "Combos", qty: Math.round(22 * multiplier), unitPrice: 6.50, revenue: 22 * multiplier * 6.50, cogsUnit: 2.10, totalCogs: 22 * multiplier * 2.10 },
    { code: "PRD-07", name: "Hot Americano", category: "Hot", qty: Math.round(31 * multiplier), unitPrice: 3.00, revenue: 31 * multiplier * 3.00, cogsUnit: 0.65, totalCogs: 31 * multiplier * 0.65 },
  ];

  const totalRevenue = demoSalesItems.reduce((acc, item) => acc + item.revenue, 0);
  const totalCogs = demoSalesItems.reduce((acc, item) => acc + item.totalCogs, 0);
  const grossProfit = totalRevenue - totalCogs;
  const grossMargin = ((grossProfit / totalRevenue) * 100).toFixed(1);
  const totalOrders = Math.round(demoSalesItems.reduce((acc, item) => acc + item.qty, 0) / 1.8);
  const avgTicket = (totalRevenue / totalOrders).toFixed(2);

  const dateRangeLabel = startDate === endDate ? startDate : `${startDate} to ${endDate}`;

  // Export to Excel handler
  const handleExportExcel = () => {
    const columns: ReportColumn[] = [
      { header: "Product SKU", key: "code" },
      { header: "Item Name", key: "name" },
      { header: "Category", key: "category" },
      { header: "Quantity Sold", key: "qty" },
      { header: "Unit Price ($)", key: "unitPrice", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Total Revenue ($)", key: "revenue", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Unit COGS ($)", key: "cogsUnit", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Total COGS ($)", key: "totalCogs", format: (v) => `$${Number(v).toFixed(2)}` },
    ];

    const summary = {
      code: "TOTALS",
      name: "Summary",
      category: "All",
      qty: demoSalesItems.reduce((a, b) => a + b.qty, 0),
      unitPrice: "—",
      revenue: `$${totalRevenue.toFixed(2)}`,
      cogsUnit: "—",
      totalCogs: `$${totalCogs.toFixed(2)}`,
    };

    exportToExcel(`Sales_Report_${startDate}_to_${endDate}`, [
      {
        sheetName: "Itemized Sales",
        columns,
        data: demoSalesItems,
        summary,
      },
    ]);
  };

  // Export to PDF handler
  const handleExportPDF = () => {
    const kpis: ReportKPI[] = [
      { label: "Total Gross Revenue", value: `$${totalRevenue.toFixed(2)}`, sublabel: `${(totalRevenue * 4000).toLocaleString()} ៛` },
      { label: "Total Orders Served", value: String(totalOrders), sublabel: `Avg Ticket $${avgTicket}` },
      { label: "Gross Margin %", value: `${grossMargin}%`, sublabel: `Profit $${grossProfit.toFixed(2)}` },
      { label: "Total COGS Cost", value: `$${totalCogs.toFixed(2)}`, sublabel: "Raw Ingredients" },
    ];

    const columns: ReportColumn[] = [
      { header: "SKU", key: "code", align: "left" },
      { header: "Product Item", key: "name", align: "left" },
      { header: "Category", key: "category", align: "left" },
      { header: "Qty Sold", key: "qty", align: "center" },
      { header: "Unit Price", key: "unitPrice", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Total Gross", key: "revenue", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Portion Margin", key: "cogsUnit", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Total COGS", key: "totalCogs", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
    ];

    const summaryRow = {
      code: "TOTALS",
      name: "Grand Total Summary",
      category: "—",
      qty: demoSalesItems.reduce((a, b) => a + b.qty, 0),
      unitPrice: "—",
      revenue: `$${totalRevenue.toFixed(2)}`,
      cogsUnit: "—",
      totalCogs: `$${totalCogs.toFixed(2)}`,
    };

    printExecutiveReport({
      title: "Executive Sales & Financial Audit Report",
      subtitle: "Consolidated POS register settlements, menu sales performance, and portion costing",
      dateRangeLabel,
      kpis,
      columns,
      data: demoSalesItems,
      summaryRow,
      branchName: "Main Flagship Branch (BKK1)",
      generatedBy: "System Auditor & Manager",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800 text-white"
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight ? "border-slate-100 bg-slate-50/70" : "border-slate-800 bg-slate-950/70"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Custom Report &amp; Data Export</h2>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Generate, filter, and export professional XLS spreadsheets and PDF audit reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          className={`p-5 border-b space-y-4 ${
            isLight ? "border-slate-100 bg-white" : "border-slate-800 bg-slate-900"
          }`}
        >
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Date Range:</span>
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "custom", label: "Custom Range" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  datePreset === p.id
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : isLight
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                }`}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Export Excel (.xlsx)</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print / PDF Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue</p>
              <p className="text-lg font-extrabold text-amber-500">${totalRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400">{(totalRevenue * 4000).toLocaleString()} ៛</p>
            </div>
            <div
              className={`p-3.5 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase">Orders Served</p>
              <p className="text-lg font-extrabold text-blue-400">{totalOrders}</p>
              <p className="text-[10px] text-slate-400">Avg ticket ${avgTicket}</p>
            </div>
            <div
              className={`p-3.5 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Margin</p>
              <p className="text-lg font-extrabold text-emerald-400">{grossMargin}%</p>
              <p className="text-[10px] text-slate-400">Profit ${grossProfit.toFixed(2)}</p>
            </div>
            <div
              className={`p-3.5 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/60"
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total COGS</p>
              <p className="text-lg font-extrabold text-rose-400">${totalCogs.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400">Ingredient Cost</p>
            </div>
          </div>

          {/* Table Preview */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-800"
            }`}
          >
            <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-950 font-bold text-xs flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span>Itemized Menu Breakdown Preview</span>
              <span className="text-[11px] font-normal text-slate-400">{demoSalesItems.length} Products</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Qty Sold</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Gross Total</th>
                  <th className="p-3 text-right">COGS Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {demoSalesItems.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[11px] text-slate-400">{item.code}</td>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{item.qty}</td>
                    <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-amber-500">${item.revenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-400">${item.totalCogs.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50/60 dark:bg-amber-500/10 font-bold border-t border-amber-200 dark:border-amber-500/30">
                  <td colSpan={3} className="p-3 text-amber-900 dark:text-amber-300">
                    Total Period Summary ({dateRangeLabel})
                  </td>
                  <td className="p-3 text-center text-amber-900 dark:text-amber-300">
                    {demoSalesItems.reduce((a, b) => a + b.qty, 0)}
                  </td>
                  <td className="p-3 text-right">—</td>
                  <td className="p-3 text-right text-amber-600 dark:text-amber-400 font-black">
                    ${totalRevenue.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-rose-500 font-black">${totalCogs.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isLight ? "border-slate-100 bg-slate-50" : "border-slate-800 bg-slate-950"
          }`}
        >
          <span className="text-slate-400">Ready to export in .xlsx and printable PDF</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
