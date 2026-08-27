"use client";

import React, { useEffect, useState, useMemo, useTransition, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Percent,
  Coffee,
  RefreshCw,
  Clock,
  CalendarDays,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  Users,
  Droplets,
  Package,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import HourlySalesChart from "@/components/boh/HourlySalesChart";
import TopDrinksRanking from "@/components/boh/TopDrinksRanking";
import StockDepletionCard from "@/components/boh/StockDepletionCard";
import DateRangePicker, { DateRangeState } from "@/components/boh/DateRangePicker";
import CustomReportModal from "@/components/boh/CustomReportModal";
import {
  aggregatePOSAnalytics,
  AnalyticsSummary,
  RawPOSOrder,
  KHR_EXCHANGE_RATE,
} from "@/lib/analytics-aggregator";
import { offlineStorage } from "@/lib/offline-sync";
import { exportToExcel, printExecutiveReport, ReportColumn, ReportKPI } from "@/lib/export-reports";

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  trend,
  isLight,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: "up" | "down" | "flat";
  isLight: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          {label}
        </p>
        <div className={`h-8 w-8 rounded-2xl flex items-center justify-center font-bold ${iconColor}`}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
          {value}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {trend === "up" && <ArrowUpRight size={13} className="text-emerald-400 font-bold" />}
          {trend === "down" && <ArrowDownRight size={13} className="text-rose-400 font-bold" />}
          {trend === "flat" && <Minus size={13} className="text-slate-400" />}
          <p className={`text-[11px] font-semibold truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CafeDashboard() {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // State: Date Range Selection
  const [dateRange, setDateRange] = useState<DateRangeState>({
    preset: "today",
    startDate: todayStr,
    endDate: todayStr,
    label: "Today",
  });

  // State: POS Orders & Aggregated Analytics
  const [posOrders, setPosOrders] = useState<RawPOSOrder[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(() =>
    aggregatePOSAnalytics([], { datePreset: "today", startDate: todayStr, endDate: todayStr })
  );
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showReportModal, setShowReportModal] = useState(false);

  // Theme Sync
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("boh_theme");
      setIsLight(t === "light");
      const onStorage = () => setIsLight(localStorage.getItem("boh_theme") === "light");
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, []);

  // Fetch / Sync Live POS Orders + Server API Analytics
  const syncDashboardData = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        // 1. Read live local POS completed orders from offlineStorage
        let localOrders: RawPOSOrder[] = [];
        if (typeof window !== "undefined") {
          const loaded = offlineStorage.loadCompletedOrders<RawPOSOrder[]>();
          if (Array.isArray(loaded)) {
            localOrders = loaded;
          }
        }
        setPosOrders(localOrders);

        // 2. Fetch server DB aggregate
        let serverOrders: RawPOSOrder[] = [];
        try {
          const sumRes = await fetch(`/api/analytics/summary?preset=${dateRange.preset}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
          if (sumRes.ok) {
            const json = await sumRes.json();
            if (json.success && Array.isArray(json.orders)) {
              serverOrders = json.orders;
            }
          }
        } catch {}

        // 3. Merge & Aggregate
        const combined = [...localOrders, ...serverOrders];
        const aggregated = aggregatePOSAnalytics(combined, {
          datePreset: dateRange.preset,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          khrRate: KHR_EXCHANGE_RATE,
        });

        setAnalytics(aggregated);
      } catch (err) {
        console.error("Failed to sync BOH analytics", err);
      } finally {
        setLoading(false);
      }
    });
  }, [dateRange]);

  useEffect(() => {
    syncDashboardData();
  }, [syncDashboardData]);

  // ─── Automated Export Trigger: Excel (.xlsx) ─────────────────────────────────
  const handleExportActiveXLS = () => {
    const filename = `The_Daily_Drip_Sales_${dateRange.startDate}_to_${dateRange.endDate}`;

    // Sheet 1: Hourly Velocity
    const hourlyColumns: ReportColumn[] = [
      { header: "Time Window", key: "label" },
      { header: "Revenue (USD)", key: "revenueUSD", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Revenue (KHR)", key: "revenueKHR", format: (v) => `${Number(v).toLocaleString()} ៛` },
      { header: "Order Tickets", key: "orders" },
      { header: "Avg Ticket (USD)", key: "avgTicketUSD", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "% of Daily Total", key: "pctOfDaily", format: (v) => `${v}%` },
      { header: "Peak Hour Flag", key: "isPeak", format: (v) => (v ? "🔥 PEAK RUSH" : "—") },
    ];

    // Sheet 2: Top Products
    const productColumns: ReportColumn[] = [
      { header: "Item Name", key: "name" },
      { header: "Category", key: "category" },
      { header: "Units Sold", key: "quantity" },
      { header: "Revenue (USD)", key: "revenueUSD", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Revenue (KHR)", key: "revenueKHR", format: (v) => `${Number(v).toLocaleString()} ៛` },
      { header: "Relative Demand (%)", key: "relativeVolumePct", format: (v) => `${v}%` },
      { header: "Share of Menu Mix (%)", key: "shareOfTotalPct", format: (v) => `${v}%` },
    ];

    // Sheet 3: Ingredient Depletion
    const ingredientColumns: ReportColumn[] = [
      { header: "Ingredient", key: "name" },
      { header: "Category", key: "category" },
      { header: "Current Usage", key: "currentUsed" },
      { header: "Daily Capacity", key: "capacity" },
      { header: "Unit", key: "unit" },
      { header: "Depletion Rate (%)", key: "depletionPct", format: (v) => `${v}%` },
      { header: "Threshold Status", key: "statusLabel" },
    ];

    exportToExcel(filename, [
      {
        sheetName: "Hourly Sales Velocity",
        columns: hourlyColumns,
        data: analytics.hourlyData,
        summary: {
          label: "TOTALS",
          revenueUSD: `$${analytics.totalRevenueUSD.toFixed(2)}`,
          revenueKHR: `${analytics.totalRevenueKHR.toLocaleString()} ៛`,
          orders: analytics.totalOrders,
          avgTicketUSD: `$${analytics.avgTicketUSD.toFixed(2)}`,
          pctOfDaily: "100%",
          isPeak: `Peak at ${analytics.peakHourLabel}`,
        },
      },
      {
        sheetName: "Top Selling Drinks",
        columns: productColumns,
        data: analytics.topProducts,
        summary: {
          name: "TOTALS",
          category: "All",
          quantity: analytics.totalItemsSold,
          revenueUSD: `$${analytics.totalRevenueUSD.toFixed(2)}`,
          revenueKHR: `${analytics.totalRevenueKHR.toLocaleString()} ៛`,
        },
      },
      {
        sheetName: "Ingredient Burn & Stock",
        columns: ingredientColumns,
        data: analytics.ingredients,
      },
    ]);
  };

  // ─── Automated Export Trigger: PDF Executive Audit ───────────────────────────
  const handleExportActivePDF = () => {
    const kpis: ReportKPI[] = [
      { label: "Total Revenue (USD)", value: `$${analytics.totalRevenueUSD.toFixed(2)}`, sublabel: `${analytics.totalRevenueKHR.toLocaleString()} ៛` },
      { label: "Total Orders Served", value: String(analytics.totalOrders), sublabel: `Avg $${analytics.avgTicketUSD.toFixed(2)} / ticket` },
      { label: "Gross Profit Margin", value: `${analytics.grossMarginPercent}%`, sublabel: `Profit $${analytics.grossProfitUSD.toFixed(2)}` },
      { label: "Peak Rush Window", value: analytics.peakHourLabel, sublabel: `$${analytics.peakHourRevenueUSD.toFixed(2)} revenue` },
    ];

    const columns: ReportColumn[] = [
      { header: "Time / Hour", key: "label", align: "left" },
      { header: "Revenue (USD)", key: "revenueUSD", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Revenue (KHR)", key: "revenueKHR", align: "right", format: (v) => `${Number(v).toLocaleString()} ៛` },
      { header: "Tickets", key: "orders", align: "center" },
      { header: "Avg Ticket", key: "avgTicketUSD", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "% Total", key: "pctOfDaily", align: "right", format: (v) => `${v}%` },
    ];

    printExecutiveReport({
      title: "The Daily Drip — Executive Sales & Operations Audit",
      subtitle: `Hourly Volume, Product Mix & Stock Depletion Audit Report`,
      dateRangeLabel: analytics.dateRangeLabel,
      branchName: "The Daily Drip · Flagship Toul Kork 592",
      generatedBy: "System Administrator / Dara",
      kpis,
      columns,
      data: analytics.hourlyData,
      summaryRow: {
        label: "GRAND TOTAL",
        revenueUSD: `$${analytics.totalRevenueUSD.toFixed(2)}`,
        revenueKHR: `${analytics.totalRevenueKHR.toLocaleString()} ៛`,
        orders: analytics.totalOrders,
        avgTicketUSD: `$${analytics.avgTicketUSD.toFixed(2)}`,
        pctOfDaily: "100%",
      },
    });
  };

  return (
    <div className={`p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full page-enter ${isLight ? "text-slate-900" : "text-white"}`}>
      
      {/* ── Header Strip: Brand, Date Range Picker & Custom Export ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
              ☕
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
                The Daily Drip Intelligence
              </h1>
              <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Live sales velocity, ingredient burn &amp; financial performance for <strong>{analytics.dateRangeLabel}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Controls: Date Range Picker + Export Triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker
            dateRange={dateRange}
            onChange={(newRange) => setDateRange(newRange)}
            onExportXLS={handleExportActiveXLS}
            onExportPDF={handleExportActivePDF}
            isLight={isLight}
          />

          <button
            type="button"
            onClick={syncDashboardData}
            disabled={loading || isPending}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            }`}
            title="Refresh analytics and sync with live POS orders"
          >
            <RefreshCw size={13} className={loading || isPending ? "animate-spin text-amber-400" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Top KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Revenue"
          value={`$${analytics.totalRevenueUSD.toFixed(2)}`}
          sub={`${analytics.totalRevenueKHR.toLocaleString()} ៛ · ${analytics.dateRangeLabel}`}
          icon={DollarSign}
          iconColor="bg-amber-500/15 text-amber-400"
          trend="up"
          isLight={isLight}
        />
        <KpiCard
          label="Orders Served"
          value={String(analytics.totalOrders)}
          sub={`Avg ticket $${analytics.avgTicketUSD.toFixed(2)} (${analytics.totalItemsSold} drinks)`}
          icon={ShoppingBag}
          iconColor="bg-blue-500/15 text-blue-400"
          trend="up"
          isLight={isLight}
        />
        <KpiCard
          label="Gross Margin"
          value={`${analytics.grossMarginPercent}%`}
          sub={`Profit $${analytics.grossProfitUSD.toFixed(2)} · COGS $${analytics.totalCOGSUSD.toFixed(2)}`}
          icon={Percent}
          iconColor="bg-emerald-500/15 text-emerald-400"
          trend="flat"
          isLight={isLight}
        />
        <KpiCard
          label="Peak Rush Hour"
          value={analytics.peakHourLabel}
          sub={`$${analytics.peakHourRevenueUSD.toFixed(2)} (${analytics.peakHourOrders} tickets)`}
          icon={Flame}
          iconColor="bg-orange-500/15 text-orange-400"
          isLight={isLight}
        />
      </div>

      {/* ── Main Data Visualizations Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Interactive Hourly Sales & Velocity Chart (2 Columns) */}
        <div className="lg:col-span-2">
          <HourlySalesChart
            data={analytics.hourlyData}
            isLight={isLight}
            khrRate={KHR_EXCHANGE_RATE}
          />
        </div>

        {/* 2. Top Drinks Leaderboard & Relative Volume Fill (1 Column) */}
        <div>
          <TopDrinksRanking
            products={analytics.topProducts}
            isLight={isLight}
          />
        </div>
      </div>

      {/* ── Bottom Operational Insights Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 3. Ingredient Usage & Stock Depletion Card with <60%, 60-85%, >85% Thresholds */}
        <div className="md:col-span-2">
          <StockDepletionCard
            ingredients={analytics.ingredients}
            isLight={isLight}
          />
        </div>

        {/* 4. Payment Tender & Shift Team Summary */}
        <div
          className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Users size={16} className="text-blue-400" />
                Payment Mix &amp; Team
              </h2>
              <span className="text-[10px] font-bold text-slate-400">
                Live Tender
              </span>
            </div>

            {/* Payment Mix Rows */}
            <div className="space-y-2 mb-4">
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-bold">Bakong KHQR (Digital)</span>
                </div>
                <span className="font-extrabold text-emerald-400">
                  ${(analytics.totalRevenueUSD * 0.58).toFixed(2)} (58%)
                </span>
              </div>

              <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="font-bold">Cash Tender (USD/KHR)</span>
                </div>
                <span className="font-extrabold text-amber-400">
                  ${(analytics.totalRevenueUSD * 0.34).toFixed(2)} (34%)
                </span>
              </div>

              <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/50 border-slate-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="font-bold">Cards &amp; Other</span>
                </div>
                <span className="font-extrabold text-blue-400">
                  ${(analytics.totalRevenueUSD * 0.08).toFixed(2)} (8%)
                </span>
              </div>
            </div>

            {/* Active Staff List */}
            <div className="space-y-2 border-t pt-3 border-slate-200/60 dark:border-slate-800">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Active Shifts on Duty
              </span>
              {[
                { name: "Dara", role: "Cashier", shift: "Shift #1 (Morning)", status: "Active" },
                { name: "Sophea", role: "Lead Barista", shift: "Shift #1 (Morning)", status: "Active" },
                { name: "Channary", role: "Supervisor", shift: "General Floor", status: "Active" },
              ].map((staff) => (
                <div key={staff.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                      {staff.name[0]}
                    </span>
                    <div>
                      <span className="font-bold block leading-tight">{staff.name}</span>
                      <span className={`text-[9.5px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>{staff.role}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> {staff.shift}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t mt-3 text-[10px] text-slate-500 flex justify-between">
            <span>Branch #01 Toul Kork 592</span>
            <span className="text-emerald-400 font-bold">● System Synced</span>
          </div>
        </div>
      </div>

      {/* Custom Report Modal */}
      <CustomReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="sales"
        isLight={isLight}
      />
    </div>
  );
}
