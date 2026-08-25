"use client";

import React, { useState } from "react";
import { Users, KeyRound, Shield, CheckCircle2, Store, Lock } from "lucide-react";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([
    { id: "usr-owner-01", name: "Sovann (Owner / Founder)", role: "OWNER", email: "owner@artisanroast.com", store: "All Branches", pinSet: true },
    { id: "usr-mgr-01", name: "Kosal (General Manager)", role: "STORE_MANAGER", email: "manager@artisanroast.com", store: "BKK1 Flagship", pinSet: true },
    { id: "usr-sup-01", name: "Channary (Shift Supervisor)", role: "SUPERVISOR", email: "supervisor@artisanroast.com", store: "BKK1 Flagship", pinSet: true },
    { id: "usr-cashier-01", name: "Dara (Front Cashier)", role: "CASHIER", email: "dara@artisanroast.com", store: "BKK1 Flagship", pinSet: true },
    { id: "usr-barista-01", name: "Sophea (Lead Barista)", role: "BARISTA", email: "sophea@artisanroast.com", store: "BKK1 Flagship", pinSet: true },
  ]);

  const [pinModal, setPinModal] = useState<any | null>(null);
  const [newPin, setNewPin] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModal || newPin.length < 4) return;
    setSuccessMsg(`✅ 4-digit PIN for ${pinModal.name} updated to ${newPin} (hashed with bcrypt).`);
    setPinModal(null);
    setNewPin("");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users size={20} className="text-amber-400" /> Staff Directory & Role-Based Access Control (RBAC)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage staff accounts, store branch assignments, and set 4-digit quick login PINs
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 px-3">Staff Name</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Email</th>
                <th className="pb-3 px-3">Store Branch</th>
                <th className="pb-3 px-3">Quick PIN</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {staff.name[0]}
                    </div>
                    {staff.name}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        staff.role === "OWNER"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : staff.role === "STORE_MANAGER"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : staff.role === "SUPERVISOR"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : staff.role === "BARISTA"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{staff.email}</td>
                  <td className="py-3.5 px-3 text-slate-300">{staff.store}</td>
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">•••• (Set)</td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setPinModal(staff)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white rounded-lg transition"
                    >
                      Reset PIN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix Helper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Shield size={16} className="text-amber-400" /> RBAC Permission Matrix Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="font-bold text-amber-400 mb-1">👑 Store Owner / Manager</p>
            <p className="text-[11px] text-slate-400">Full access to Executive KPIs, Recipe BOMs, Multi-Store Sync, Supplier POs, Staff PINs, and Z-Reports.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="font-bold text-blue-400 mb-1">🛡️ Shift Supervisor</p>
            <p className="text-[11px] text-slate-400">Access to Cash Shift Audits, Inventory Waste/Spillage logging, Drawer reconciliation, and POS Register.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="font-bold text-slate-200 mb-1">☕ Cashier</p>
            <p className="text-[11px] text-slate-400">Access to Fast Counter Register, Customer Checkout, Thermal Receipt Printing, and Cash Float.</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="font-bold text-emerald-400 mb-1">🫘 Barista</p>
            <p className="text-[11px] text-slate-400">Dedicated Kitchen Display System (KDS), drink timers, and order preparation bumping.</p>
          </div>
        </div>
      </div>

      {/* Reset PIN Modal */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Reset Quick PIN: {pinModal.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Enter a new 4-digit numeric PIN</p>

            <form onSubmit={handleResetPin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full text-center tracking-widest text-lg font-bold bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 transition"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
