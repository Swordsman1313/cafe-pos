"use client";

import React from "react";
import {
  Users,
  Clock,
  Zap,
  TrendingUp,
  DollarSign,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Moon,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { StaffUtilization } from "@/lib/analytics-aggregator";
import Link from "next/link";

interface StaffUtilizationCardProps {
  staff: StaffUtilization[];
  isLight?: boolean;
  onEndShiftClick?: () => void;
}

// Shorten shift string helper (e.g., "Shift #1 (7:00 AM – 3:00 PM)" -> "7am–3pm")
function formatShiftLabel(role: string, shift: string): string {
  if (shift.includes("7:00 AM") && shift.includes("3:00 PM")) {
    return `${role} • 7am–3pm`;
  }
  if (shift.includes("8:00 AM") && shift.includes("4:00 PM")) {
    return `${role} • 8am–4pm`;
  }
  const cleanShift = shift.replace(/Shift #\d+\s*\(/i, "").replace(/\)$/, "").trim();
  return `${role} • ${cleanShift}`;
}

export default function StaffUtilizationCard({
  staff,
  isLight = false,
  onEndShiftClick,
}: StaffUtilizationCardProps) {
  return (
    <div
      className={`rounded-3xl border p-5 transition-all flex flex-col justify-between ${
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
      }`}
    >
      {/* ── Header (Clean, no subtitle) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              Active Staff &amp; Shift Utilization
            </h2>
          </div>

          <span className="text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> {staff.length} On Duty
          </span>
        </div>

        {/* ── Staff List with Clean Surface Metric Boxes ── */}
        <div className="space-y-2.5 pt-1">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`p-3 rounded-2xl border transition-all ${
                isLight ? "bg-slate-50/70 border-slate-200/80" : "bg-slate-800/40 border-slate-700/60"
              }`}
            >
              {/* Top Row: Avatar, Name, Shortened Role • Shift Hours & Revenue */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`h-8 w-8 rounded-xl ${member.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}
                  >
                    {member.name[0]}
                  </div>
                  <div className="min-w-0">
                    <span className={`font-bold text-xs block leading-tight truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                      {member.name}
                    </span>
                    <span className={`text-[10px] font-medium block truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {formatShiftLabel(member.role, member.shift)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-black block ${isLight ? "text-slate-900" : "text-amber-400"}`}>
                    ${member.totalRevenueHandledUSD.toFixed(2)}
                  </span>
                  <span className={`text-[9.5px] font-semibold block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Sales Volume
                  </span>
                </div>
              </div>

              {/* ── Clean Light Metric Surface Box ── */}
              <div
                className={`grid grid-cols-3 gap-2 my-2 p-2.5 rounded-xl border text-center transition-all ${
                  isLight
                    ? "bg-slate-50 border-slate-200/80 shadow-2xs"
                    : "bg-slate-800/80 border-slate-700/80"
                }`}
              >
                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Ring-Up Rate
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 ${isLight ? "text-amber-800" : "text-amber-300"}`}>
                    {member.ticketsPerHour} <span className="text-[9.5px] font-normal text-slate-500">tix/h</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Avg Speed
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                    {member.avgTicketTimeSec}s <span className="text-[9.5px] font-normal text-slate-500">/ord</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Utilization
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 ${isLight ? "text-blue-700" : "text-blue-400"}`}>
                    {member.activeTimePct}%
                  </span>
                </div>
              </div>

              {/* ── Progress Bar (Redundant bottom text lines removed) ── */}
              <div className={`h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
                <div
                  style={{ width: `${Math.min(member.activeTimePct, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    member.activeTimePct >= 80
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : member.activeTimePct >= 50
                      ? "bg-gradient-to-r from-blue-600 to-blue-400"
                      : "bg-gradient-to-r from-amber-600 to-amber-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1-Tap Shift Handoff Shortcut Action Button ── */}
      <div className="pt-3 border-t mt-3 border-slate-200/60 dark:border-slate-800">
        <Link
          href="/admin/shifts"
          className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 font-black text-xs flex items-center justify-between transition-all active:scale-95 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Moon size={15} className="text-amber-500" />
            <span>End Shift / Cash Drawer Count</span>
          </div>
          <ArrowRight size={14} className="text-amber-500" />
        </Link>
      </div>
    </div>
  );
}
