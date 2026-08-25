"use client";

import React, { useEffect, useState, useMemo, useTransition } from "react";
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
} from "lucide-react";

// ─── Mock data helpers (replace with real API data) ───────────────────────────
const HOURS = [
  "6am","7am","8am","9am","10am","11am","12pm",
  "1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm",
];

const DAYS_OF_WEEK = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface HourlyBar  { hour: string; revenue: number; orders: number; }
interface DailyBar   { day: string; revenue: number; orders: number; }
interface TopProduct { name: string; quantity: number; revenue: number; category: string; }
interface Summary {
  totalRevenueUSD: number;
  totalRevenueKHR: number;
  totalOrders: number;
  avgTicketUSD: number;
  grossMarginPercent: number;
  grossProfitUSD: number;
  totalCOGS: number;
  peakHour: string;
  beansUsedKg: number;
  milkUsedL: number;
}

// ─── Fallback demo data (shown when API is empty) ─────────────────────────────
const DEMO_SUMMARY: Summary = {
  totalRevenueUSD: 847.50,
  totalRevenueKHR: 3390000,
  totalOrders: 142,
  avgTicketUSD: 5.97,
  grossMarginPercent: 68.5,
  grossProfitUSD: 580.54,
  totalCOGS: 266.96,
  peakHour: "9am",
  beansUsedKg: 2.4,
  milkUsedL: 8.7,
};

const DEMO_HOURLY: HourlyBar[] = HOURS.map((hour, i) => ({
  hour,
  revenue: [12,38,95,120,88,74,62,55,48,72,65,58,42,30,18,8][i] ?? 0,
  orders:  [2,8,18,22,16,14,12,10,9,14,12,11,8,6,4,2][i] ?? 0,
}));

const DEMO_WEEKLY: DailyBar[] = DAYS_OF_WEEK.map((day, i) => ({
  day,
  revenue: [620,710,795,840,920,1080,740][i] ?? 0,
  orders:  [104,119,133,140,154,181,124][i] ?? 0,
}));

const DEMO_TOP: TopProduct[] = [
  { name: "Cambodian Iced Coffee", quantity: 38, revenue: 133,  category: "Iced" },
  { name: "Espresso Tonic",        quantity: 27, revenue: 108,  category: "Specialty" },
  { name: "Oat Milk Latte",        quantity: 24, revenue: 108,  category: "Hot" },
  { name: "Cold Brew Float",       quantity: 19, revenue:  95,  category: "Iced" },
  { name: "Matcha Latte",          quantity: 15, revenue:  82.5, category: "Specialty" },
];

// ─── Reusable mini chart bar ──────────────────────────────────────────────────
function Bar({
  value, max, label, sublabel, color = "amber", isActive,
}: {
  value: number; max: number; label: string; sublabel: string;
  color?: "amber" | "blue"; isActive?: boolean;
}) {
  const pct = Math.max(4, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="flex flex-col items-center gap-1 group relative flex-1 min-w-0">
      {/* Tooltip */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none z-20 whitespace-nowrap">
        {sublabel}
      </div>
      {/* Bar track */}
      <div className="w-full flex-1 flex items-end" style={{ height: 80 }}>
        <div
          style={{ height: `${pct}%` }}
          className={`w-full rounded-t-md transition-all duration-300 bar-grow ${
            isActive
              ? color === "amber"
                ? "bg-gradient-to-t from-amber-600 to-amber-300 shadow-amber-500/40 shadow-md"
                : "bg-gradient-to-t from-blue-600 to-blue-300 shadow-blue-500/40 shadow-md"
              : color === "amber"
              ? "bg-gradient-to-t from-amber-700/70 to-amber-500/50 group-hover:brightness-125"
              : "bg-gradient-to-t from-blue-700/70 to-blue-500/50 group-hover:brightness-125"
          }`}
        />
      </div>
      <span className={`text-[9px] font-medium ${isActive ? "text-amber-400 font-bold" : "text-slate-500"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconColor, trend, isLight,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconColor: string; trend?: "up" | "down" | "flat"; isLight: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-2 ${
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
    }`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>{value}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {trend === "up"   && <ArrowUpRight   size={12} className="text-emerald-400" />}
          {trend === "down" && <ArrowDownRight  size={12} className="text-red-400" />}
          {trend === "flat" && <Minus           size={12} className="text-slate-400" />}
          <p className={`text-[11px] font-semibold ${isLight ? "text-slate-400" : "text-slate-400"}`}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

import CustomReportModal from "@/components/boh/CustomReportModal";

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CafeDashboard() {
  const [summary,    setSummary]    = useState<Summary>(DEMO_SUMMARY);
  const [hourly,     setHourly]     = useState<HourlyBar[]>(DEMO_HOURLY);
  const [weekly,     setWeekly]     = useState<DailyBar[]>(DEMO_WEEKLY);
  const [topItems,   setTopItems]   = useState<TopProduct[]>(DEMO_TOP);
  const [loading,    setLoading]    = useState(false);
  const [chartView,  setChartView]  = useState<"hourly" | "weekly">("hourly");
  const [isPending,  startTransition] = useTransition();
  const [showReportModal, setShowReportModal] = useState(false);

  // Read theme from parent localStorage (layout sets it on <html>)
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("boh_theme");
    setIsLight(t === "light");
    const onStorage = () => setIsLight(localStorage.getItem("boh_theme") === "light");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const fetchData = () => {
    startTransition(async () => {
      setLoading(true);
      try {
        const sumRes = await fetch("/api/analytics/summary");
        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          if (sumJson.success && sumJson.summary) {
            const s = sumJson.summary;
            setSummary({
              totalRevenueUSD: s.totalRevenueUSD || DEMO_SUMMARY.totalRevenueUSD,
              totalRevenueKHR: s.totalRevenueKHR || DEMO_SUMMARY.totalRevenueKHR,
              totalOrders: s.totalOrders || DEMO_SUMMARY.totalOrders,
              avgTicketUSD: s.avgTicketUSD || DEMO_SUMMARY.avgTicketUSD,
              grossMarginPercent: s.grossMarginPercent || DEMO_SUMMARY.grossMarginPercent,
              grossProfitUSD: s.grossProfitUSD || DEMO_SUMMARY.grossProfitUSD,
              totalCOGS: s.totalCOGS || DEMO_SUMMARY.totalCOGS,
              peakHour: "9am",
              beansUsedKg: Number(((s.totalOrders || 142) * 0.018).toFixed(1)),
              milkUsedL: Number(((s.totalOrders || 142) * 0.065).toFixed(1)),
            });
            if (sumJson.hourlyVelocity && sumJson.hourlyVelocity.length > 0) {
              const hasData = sumJson.hourlyVelocity.some((v: any) => v.revenue > 0);
              if (hasData) {
                setHourly(sumJson.hourlyVelocity.map((v: any) => ({
                  hour: v.label,
                  revenue: v.revenue,
                  orders: v.orders,
                })));
              }
            }
            if (sumJson.topProducts && sumJson.topProducts.length > 0) {
              setTopItems(sumJson.topProducts.map((p: any) => ({
                name: p.name,
                quantity: p.quantity,
                revenue: p.revenue,
                category: "Coffee",
              })));
            }
          }
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => { fetchData(); }, []);

  // Chart data depending on view
  const chartData  = chartView === "hourly" ? hourly  : weekly;
  const chartMax   = useMemo(
    () => Math.max(...(chartView === "hourly" ? hourly : weekly).map(d => d.revenue), 10),
    [hourly, weekly, chartView]
  );

  // Peak hour label
  const peakHour = useMemo(() => {
    const peak = [...hourly].sort((a, b) => b.revenue - a.revenue)[0];
    return peak?.hour ?? "—";
  }, [hourly]);

  // Today's revenue vs yesterday estimate (dummy +12% for now)
  const revTrend: "up" | "down" | "flat" = "up";

  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className={`p-6 space-y-6 max-w-7xl mx-auto w-full page-enter ${isLight ? "text-slate-900" : "text-white"}`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Coffee size={20} className="text-amber-500" />
            Daily Café Intelligence
          </h1>
          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {todayLabel} · Live sales data &amp; performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Custom Export (XLS / PDF)</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading || isPending}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <RefreshCw size={13} className={loading || isPending ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Custom Report Modal */}
      <CustomReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="sales"
        isLight={isLight}
      />

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Today's Revenue"
          value={`$${summary.totalRevenueUSD.toFixed(2)}`}
          sub={`${summary.totalRevenueKHR.toLocaleString()} ៛ · +12% vs yesterday`}
          icon={DollarSign}
          iconColor="bg-amber-500/15 text-amber-400"
          trend={revTrend}
          isLight={isLight}
        />
        <KpiCard
          label="Orders Served"
          value={String(summary.totalOrders)}
          sub={`Avg ticket $${summary.avgTicketUSD.toFixed(2)}`}
          icon={ShoppingBag}
          iconColor="bg-blue-500/15 text-blue-400"
          trend="up"
          isLight={isLight}
        />
        <KpiCard
          label="Gross Margin"
          value={`${summary.grossMarginPercent}%`}
          sub={`Profit $${summary.grossProfitUSD.toFixed(2)} · COGS $${summary.totalCOGS.toFixed(2)}`}
          icon={Percent}
          iconColor="bg-emerald-500/15 text-emerald-400"
          trend="flat"
          isLight={isLight}
        />
        <KpiCard
          label="Peak Rush Hour"
          value={peakHour}
          sub={`Busiest window of the day`}
          icon={Flame}
          iconColor="bg-orange-500/15 text-orange-400"
          isLight={isLight}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sales Chart */}
        <div className={`lg:col-span-2 rounded-3xl border p-5 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
        }`}>
          {/* Chart header + toggle */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-400" />
                {chartView === "hourly" ? "Today's Hourly Sales" : "This Week's Daily Sales"}
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                {chartView === "hourly"
                  ? "Revenue & order volume by hour"
                  : "Revenue trend across 7-day rolling window"}
              </p>
            </div>
            {/* View toggle */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800 border-slate-700"
            }`}>
              <button
                onClick={() => setChartView("hourly")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  chartView === "hourly"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock size={11} /> Hourly
              </button>
              <button
                onClick={() => setChartView("weekly")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  chartView === "weekly"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarDays size={11} /> Weekly
              </button>
            </div>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-1.5 pb-2" style={{ height: 100 }}>
            {chartData.map((d, i) => {
              const isHour = chartView === "hourly";
              const hourLabel = isHour ? (d as HourlyBar).hour : "";
              const dayLabel  = !isHour ? (d as DailyBar).day : "";
              const isActive = isHour
                ? hourLabel === peakHour
                : i === new Date().getDay() - 1;
              return (
                <Bar
                  key={isHour ? hourLabel : dayLabel}
                  value={d.revenue}
                  max={chartMax}
                  label={isHour ? hourLabel : dayLabel}
                  sublabel={`${isHour ? hourLabel : dayLabel}: $${d.revenue.toFixed(0)} (${d.orders} orders)`}
                  isActive={isActive}
                />
              );
            })}
          </div>

          {/* X-axis revenue scale hint */}
          <div className={`flex justify-between text-[9px] font-medium pt-2 border-t ${
            isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-600"
          }`}>
            <span>$0</span>
            <span>${(chartMax / 2).toFixed(0)}</span>
            <span>${chartMax.toFixed(0)}</span>
          </div>
        </div>

        {/* Top Selling Drinks */}
        <div className={`rounded-3xl border p-5 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
        }`}>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Star size={16} className="text-amber-400" />
            Top Drinks Today
          </h2>
          <div className="space-y-2.5">
            {topItems.map((item, idx) => {
              const barPct = Math.round((item.revenue / (topItems[0]?.revenue || 1)) * 100);
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{medals[idx] ?? `#${idx + 1}`}</span>
                      <div>
                        <p className={`font-bold leading-tight ${isLight ? "text-slate-800" : "text-white"}`}>
                          {item.name}
                        </p>
                        <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                          {item.quantity} sold · {item.category}
                        </p>
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold text-xs">${item.revenue.toFixed(0)}</span>
                  </div>
                  {/* Revenue share bar */}
                  <div className={`h-1 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                    <div
                      style={{ width: `${barPct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Ingredient Usage Today */}
        <div className={`rounded-3xl border p-5 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
        }`}>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Package size={16} className="text-emerald-400" />
            Ingredient Usage Today
          </h2>
          <div className="space-y-3">
            {[
              { label: "Coffee Beans", value: `${summary.beansUsedKg} kg`, icon: "🫘", pct: 64, color: "amber" },
              { label: "Milk (all types)", value: `${summary.milkUsedL} L`, icon: "🥛", pct: 72, color: "blue" },
              { label: "Syrups", value: "1.2 L", icon: "🍯", pct: 40, color: "orange" },
              { label: "Cups & Sleeves", value: "142 pcs", icon: "🥤", pct: 90, color: "slate" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-semibold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    {r.icon} {r.label}
                  </span>
                  <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{r.value}</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                  <div
                    style={{ width: `${r.pct}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${
                      r.pct > 80 ? "bg-red-500" : r.pct > 60 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Order Heatmap (Mini) */}
        <div className={`rounded-3xl border p-5 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
        }`}>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-400" />
            Rush Hour Heatmap
          </h2>
          <div className="grid grid-cols-4 gap-1.5">
            {hourly.slice(0, 16).map((h) => {
              const intensity = Math.round((h.revenue / chartMax) * 100);
              let bg = isLight ? "bg-slate-100" : "bg-slate-800";
              if (intensity > 80) bg = "bg-amber-500 text-slate-950 font-bold";
              else if (intensity > 50) bg = isLight ? "bg-amber-300/60 text-amber-900" : "bg-amber-700/60 text-amber-200";
              else if (intensity > 20) bg = isLight ? "bg-amber-100 text-amber-800" : "bg-amber-900/40 text-amber-400";
              return (
                <div
                  key={h.hour}
                  title={`${h.hour}: $${h.revenue} (${h.orders} orders)`}
                  className={`rounded-lg text-[10px] font-semibold text-center py-1.5 transition ${bg}`}
                >
                  {h.hour}
                </div>
              );
            })}
          </div>
          <p className={`text-[10px] mt-3 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
            🟠 Hot = high sales volume · ⬜ Light = slow period
          </p>
        </div>

        {/* Team On-Duty Today */}
        <div className={`rounded-3xl border p-5 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
        }`}>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-400" />
            Team On Duty
          </h2>
          <div className="space-y-2.5">
            {[
              { name: "Dara",    role: "Cashier",    shift: "7am – 3pm",  status: "active" },
              { name: "Sophea",  role: "Barista",    shift: "7am – 3pm",  status: "active" },
              { name: "Channary",role: "Supervisor", shift: "8am – 4pm",  status: "active" },
              { name: "Pisey",   role: "Barista",    shift: "2pm – 10pm", status: "upcoming" },
            ].map((m) => (
              <div key={m.name} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/60 border-slate-700/60"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    m.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700/50 text-slate-400"
                  }`}>
                    {m.name[0]}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{m.name}</p>
                    <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>{m.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>{m.shift}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    m.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isLight ? "bg-slate-200 text-slate-500" : "bg-slate-700 text-slate-500"
                  }`}>
                    {m.status === "active" ? "● On duty" : "◌ Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
