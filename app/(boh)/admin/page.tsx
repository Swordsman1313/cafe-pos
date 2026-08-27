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
  Zap,
} from "lucide-react";
import HourlySalesChart from "@/components/boh/HourlySalesChart";
import HourlyBreakdownDrawer from "@/components/boh/HourlyBreakdownDrawer";
import TopDrinksRanking from "@/components/boh/TopDrinksRanking";
import StockDepletionCard from "@/components/boh/StockDepletionCard";
import StaffUtilizationCard from "@/components/boh/StaffUtilizationCard";
import DateRangePicker, { DateRangeState } from "@/components/boh/DateRangePicker";
import CustomReportModal from "@/components/boh/CustomReportModal";
import {
  aggregatePOSAnalytics,
  AnalyticsSummary,
  HourlyBucket,
  DailyBucket,
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
          {trend === "up" && <ArrowUpRight size={13} className="text-emerald-500 font-bold" />}
          {trend === "down" && <ArrowDownRight size={13} className="text-rose-500 font-bold" />}
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

  // State: Active Slide-Over Hour / Day Breakdown
  const [selectedBucket, setSelectedBucket] = useState<HourlyBucket | DailyBucket | null>(null);

  // State: POS Orders & Aggregated Analytics
  const [posOrders, setPosOrders] = useState<RawPOSOrder[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(() =>
    aggregatePOSAnalytics([], { datePreset: "today", startDate: todayStr, endDate: todayStr })
  );
  const [loading, setLoading] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
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
  const syncDashboardData = useCallback((showToastAlert = false) => {
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

        if (showToastAlert) {
          setSyncToast("Data synchronized with POS terminal");
          setTimeout(() => {
            setSyncToast(null);
          }, 3500);
        }
      } catch (err) {
        console.error("Failed to sync BOH analytics", err);
      } finally {
        setLoading(false);
      }
    });
  }, [dateRange]);

  useEffect(() => {
    syncDashboardData(false);
  }, [syncDashboardData]);

  // ─── Automated Export Trigger: Excel (.xlsx) ─────────────────────────────────
  const handleExportActiveXLS = () => {
    const filename = `The_Daily_Drip_Sales_${dateRange.startDate}_to_${dateRange.endDate}`;

    // Sheet 1: Hourly or Daily Velocity
    const velocityColumns: ReportColumn[] = [
      { header: "Window / Day", key: "label" },
      { header: "Revenue (USD)", key: "revenueUSD", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Revenue (KHR)", key: "revenueKHR", format: (v) => `${Number(v).toLocaleString()} ៛` },
      { header: "Order Tickets", key: "orders" },
      { header: "Avg Ticket (USD)", key: "avgTicketUSD", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Avg Speed (sec)", key: "avgTransactionSpeedSec", format: (v) => `${v}s` },
      { header: "% of Total", key: "pctOfDaily", format: (v) => `${v}%` },
      { header: "Peak Flag", key: "isPeak", format: (v) => (v ? "🔥 PEAK" : "—") },
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

    // Sheet 3: Ingredient Depletion & Restock
    const ingredientColumns: ReportColumn[] = [
      { header: "Ingredient", key: "name" },
      { header: "Category", key: "category" },
      { header: "Current Usage", key: "currentUsed" },
      { header: "Daily Capacity", key: "capacity" },
      { header: "Unit", key: "unit" },
      { header: "Depletion Rate (%)", key: "depletionPct", format: (v) => `${v}%` },
      { header: "Hours Until Empty", key: "hoursUntilDepletion", format: (v) => `${v} hrs` },
      { header: "Supplier", key: "supplierName" },
      { header: "Threshold Status", key: "statusLabel" },
    ];

    exportToExcel(filename, [
      {
        sheetName: analytics.isWeeklyView ? "7-Day Sales Velocity" : "Hourly Sales Velocity",
        columns: velocityColumns,
        data: analytics.isWeeklyView ? analytics.dailyData : analytics.hourlyData,
        summary: {
          label: "TOTALS",
          revenueUSD: `$${analytics.totalRevenueUSD.toFixed(2)}`,
          revenueKHR: `${analytics.totalRevenueKHR.toLocaleString()} ៛`,
          orders: analytics.totalOrders,
          avgTicketUSD: `$${analytics.avgTicketUSD.toFixed(2)}`,
          avgTransactionSpeedSec: "—",
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
        sheetName: "Ingredient Burn & Restock",
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
      { label: "Peak Window", value: analytics.peakHourLabel, sublabel: `$${analytics.peakHourRevenueUSD.toFixed(2)} revenue` },
    ];

    const columns: ReportColumn[] = [
      { header: analytics.isWeeklyView ? "Day" : "Time / Hour", key: "label", align: "left" },
      { header: "Revenue (USD)", key: "revenueUSD", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "Revenue (KHR)", key: "revenueKHR", align: "right", format: (v) => `${Number(v).toLocaleString()} ៛` },
      { header: "Tickets", key: "orders", align: "center" },
      { header: "Avg Ticket", key: "avgTicketUSD", align: "right", format: (v) => `$${Number(v).toFixed(2)}` },
      { header: "% Total", key: "pctOfDaily", align: "right", format: (v) => `${v}%` },
    ];

    printExecutiveReport({
      title: "The Daily Drip — Executive Sales & Operations Audit",
      subtitle: `Sales Volume, Product Mix & Stock Depletion Audit Report`,
      dateRangeLabel: analytics.dateRangeLabel,
      branchName: "The Daily Drip · Flagship Toul Kork 592",
      generatedBy: "System Administrator / Dara",
      kpis,
      columns,
      data: analytics.isWeeklyView ? analytics.dailyData : analytics.hourlyData,
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
      
      {/* ── STICKY TOP BAR: Date Range Picker, Real-time Sync & Export Triggers ── */}
      <div
        className={`sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 backdrop-blur-md border-b transition-all ${
          isLight
            ? "bg-white/90 border-slate-200/80 shadow-xs"
            : "bg-slate-950/85 border-slate-800/80 shadow-md"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
                ☕
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
                  The Daily Drip Intelligence
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    ● Live Sync
                  </span>
                </h1>
                <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Active Window: <strong className="text-amber-700 dark:text-amber-400">{analytics.dateRangeLabel}</strong> · Branch #01 Toul Kork
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Controls: Date Range Picker + Export Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              dateRange={dateRange}
              onChange={(newRange) => setDateRange(newRange)}
              onExportXLS={handleExportActiveXLS}
              onExportPDF={handleExportActivePDF}
              isLight={isLight}
            />

            <button
              type="button"
              onClick={() => syncDashboardData(true)}
              disabled={loading || isPending}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                isLight
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
              title="Refresh analytics and sync with live POS terminal"
            >
              <RefreshCw size={13} className={loading || isPending ? "animate-spin text-amber-500" : "text-amber-500"} />
              <span>{loading || isPending ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Header Toast Alert on Sync ── */}
      {syncToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-slate-950 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* ── Top KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Revenue"
          value={`$${analytics.totalRevenueUSD.toFixed(2)}`}
          sub={`${analytics.totalRevenueKHR.toLocaleString()} ៛ · ${analytics.dateRangeLabel}`}
          icon={DollarSign}
          iconColor="bg-amber-500/15 text-amber-500"
          trend="up"
          isLight={isLight}
        />
        <KpiCard
          label="Orders Served"
          value={String(analytics.totalOrders)}
          sub={`Avg ticket $${analytics.avgTicketUSD.toFixed(2)} (${analytics.totalItemsSold} drinks)`}
          icon={ShoppingBag}
          iconColor="bg-blue-500/15 text-blue-500"
          trend="up"
          isLight={isLight}
        />
        <KpiCard
          label="Gross Margin"
          value={`${analytics.grossMarginPercent}%`}
          sub={`Profit $${analytics.grossProfitUSD.toFixed(2)} · COGS $${analytics.totalCOGSUSD.toFixed(2)}`}
          icon={Percent}
          iconColor="bg-emerald-500/15 text-emerald-500"
          trend="flat"
          isLight={isLight}
        />
        <KpiCard
          label={analytics.isWeeklyView ? "Peak Day" : "Peak Rush Hour"}
          value={analytics.peakHourLabel}
          sub={`$${analytics.peakHourRevenueUSD.toFixed(2)} (${analytics.peakHourOrders} tickets)`}
          icon={Flame}
          iconColor="bg-orange-500/15 text-orange-500"
          isLight={isLight}
        />
      </div>

      {/* ── Main Interactive Data Visualizations Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Interactive Hourly / 7-Day Velocity Chart (2 Columns) */}
        <div className="lg:col-span-2">
          <HourlySalesChart
            data={analytics.hourlyData}
            dailyData={analytics.dailyData}
            isWeeklyView={analytics.isWeeklyView}
            isLight={isLight}
            khrRate={KHR_EXCHANGE_RATE}
            onSelectHour={(bucket) => setSelectedBucket(bucket)}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 3. Actionable Ingredient Usage & Stock Depletion Card (2 Columns) */}
        <div className="lg:col-span-2">
          <StockDepletionCard
            ingredients={analytics.ingredients}
            isLight={isLight}
          />
        </div>

        {/* 4. Operational Staff Utilization & Shift Synchronization (1 Column) */}
        <div>
          <StaffUtilizationCard
            staff={analytics.staff}
            isLight={isLight}
          />
        </div>
      </div>

      {/* ── Slide-Over Granular Breakdown Drawer ── */}
      {selectedBucket && (
        <HourlyBreakdownDrawer
          bucket={selectedBucket}
          onClose={() => setSelectedBucket(null)}
          isLight={isLight}
        />
      )}

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
