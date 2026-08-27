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
      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                Active Staff &amp; Shift Utilization
              </h2>
              <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Real-time speed, throughput &amp; station efficiency
              </p>
            </div>
          </div>

          <span className="text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> {staff.length} On Duty
          </span>
        </div>

        {/* ── Staff List with Clean Surface Metric Boxes ── */}
        <div className="space-y-3 pt-1">
          {staff.map((member) => (
            <div
              key={member.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isLight ? "bg-slate-50/70 border-slate-200/80" : "bg-slate-800/40 border-slate-700/60"
              }`}
            >
              {/* Top Row: Avatar, Name, Role & Revenue Handled */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-xl ${member.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs`}
                  >
                    {member.name[0]}
                  </div>
                  <div>
                    <span className={`font-bold text-xs block leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                      {member.name}
                    </span>
                    <span className={`text-[10px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {member.role} · {member.shift}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-black block ${isLight ? "text-slate-900" : "text-amber-400"}`}>
                    ${member.totalRevenueHandledUSD.toFixed(2)}
                  </span>
                  <span className={`text-[9.5px] font-semibold block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Sales Volume
                  </span>
                </div>
              </div>

              {/* ── Clean Light Metric Surface Box (Fix for Muddy Grey Box) ── */}
              <div
                className={`grid grid-cols-3 gap-2 my-2.5 p-3 rounded-xl border text-center transition-all ${
                  isLight
                    ? "bg-slate-50 border-slate-200/80 shadow-2xs"
                    : "bg-slate-800/80 border-slate-700/80"
                }`}
              >
                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Ring-Up Rate
                  </span>
                  <span className={`text-base font-bold block mt-0.5 ${isLight ? "text-amber-800" : "text-amber-300"}`}>
                    {member.ticketsPerHour} <span className="text-[10px] font-normal text-slate-500">tix/hr</span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Avg Speed
                  </span>
                  <span className={`text-base font-bold block mt-0.5 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                    {member.avgTicketTimeSec}s <span className="text-[10px] font-normal text-slate-500">/ ord</span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
                    Utilization
                  </span>
                  <span className={`text-base font-bold block mt-0.5 ${isLight ? "text-blue-700" : "text-blue-400"}`}>
                    {member.activeTimePct}%
                  </span>
                </div>
              </div>

              {/* ── Corrected Progress Bar Formula: Accurately renders partial fill e.g. Channary at ~28.5% ── */}
              <div className="space-y-1">
                <div className={`h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-200/80" : "bg-slate-800"}`}>
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
                <div className="flex justify-between text-[8.5px] text-slate-400 font-semibold px-0.5">
                  <span>Station Active: {member.activeTimePct}%</span>
                  <span>Idle / Handoff: {member.idleTimePct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 1-Tap Shift Handoff Shortcut Action Button ── */}
      <div className="pt-4 border-t mt-4 border-slate-200/60 dark:border-slate-800 space-y-2">
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
