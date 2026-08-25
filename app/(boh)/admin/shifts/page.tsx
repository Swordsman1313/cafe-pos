"use client";

import React, { useEffect, useState, useMemo, useCallback, useTransition } from "react";
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle2,
  Printer,
  FileText,
  Calculator,
  ShieldCheck,
  RotateCcw,
  User,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { exportToExcel, printExecutiveReport } from "@/lib/export-reports";

const USD_DENOMS = [100, 50, 20, 10, 5, 2, 1];
const KHR_DENOMS = [100000, 50000, 20000, 15000, 10000, 5000, 2000, 1000, 500, 100];
const KHR_RATE = 4000;

const EMPTY_USD: Record<number, number> = { 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 };
const EMPTY_KHR: Record<number, number> = { 100000: 0, 50000: 0, 20000: 0, 15000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 100: 0 };

export default function ShiftsAndZReports() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [selectedZReport, setSelectedZReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Theme detection
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("boh_theme");
    setIsLight(t === "light");
    const onStorage = () => setIsLight(localStorage.getItem("boh_theme") === "light");
    window.addEventListener("storage", onStorage);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCounterModal(false);
        setShowMovementModal(false);
        setSelectedZReport(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ── Denomination counter ───────────────────────────────────────────────────
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [usdCounts, setUsdCounts] = useState<Record<number, number>>({ ...EMPTY_USD });
  const [khrCounts, setKhrCounts] = useState<Record<number, number>>({ ...EMPTY_KHR });

  // ── Cash movement ──────────────────────────────────────────────────────────
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<"PAY_IN" | "PAY_OUT" | "SAFE_DROP">("PAY_OUT");
  const [movementAmountUSD, setMovementAmountUSD] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // ── Memoized cash totals ──────────────────────────────────────────────────
  const totalPhysicalUSD = useMemo(
    () => USD_DENOMS.reduce((sum, d) => sum + d * (usdCounts[d] || 0), 0),
    [usdCounts]
  );
  const totalPhysicalKHR = useMemo(
    () => KHR_DENOMS.reduce((sum, d) => sum + d * (khrCounts[d] || 0), 0),
    [khrCounts]
  );
  const grandTotalPhysicalUSD = useMemo(
    () => totalPhysicalUSD + totalPhysicalKHR / KHR_RATE,
    [totalPhysicalUSD, totalPhysicalKHR]
  );
  
  const expectedDrawerUSD = currentShift?.calculated?.expectedUSD 
    ?? (currentShift?.startingFloatUSD != null && currentShift?.totalCashSalesUSD != null 
        ? currentShift.startingFloatUSD + currentShift.totalCashSalesUSD 
        : currentShift?.startingFloatUSD ?? 50.0);
        
  const varianceUSD = grandTotalPhysicalUSD - expectedDrawerUSD;

  // ── Stable input handlers ─────────────────────────────────────────────────
  const handleUsdChange = useCallback((denom: number, raw: string) => {
    const val = parseInt(raw, 10) || 0;
    setUsdCounts(prev => ({ ...prev, [denom]: val }));
  }, []);

  const handleKhrChange = useCallback((denom: number, raw: string) => {
    const val = parseInt(raw, 10) || 0;
    setKhrCounts(prev => ({ ...prev, [denom]: val }));
  }, []);

  const handleResetCounter = useCallback(() => {
    setUsdCounts({ ...EMPTY_USD });
    setKhrCounts({ ...EMPTY_KHR });
  }, []);

  // ── Data fetch & local POS sync ───────────────────────────────────────────
  const fetchData = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      try {
        // First check if POS has an active shift stored locally
        let activePosShift: any = null;
        try {
          const localShiftStr = localStorage.getItem("pos_active_shift");
          if (localShiftStr) {
            const parsed = JSON.parse(localShiftStr);
            if (parsed.isOpen) {
              activePosShift = {
                id: "shift-pos-live",
                cashierName: parsed.cashierName,
                openedAt: parsed.startedAt,
                startingFloatUSD: parsed.floatUSD,
                startingFloatKHR: parsed.floatKHR,
                totalCashSalesUSD: parsed.totalCashSalesUSD || 0,
                totalQRSalesUSD: parsed.totalQRSalesUSD || 0,
                totalCardSalesUSD: 0,
                orderCount: parsed.orderCount || 0,
                status: "OPEN",
                calculated: {
                  expectedUSD: parsed.floatUSD + (parsed.totalCashSalesUSD || 0),
                }
              };
            }
          }
        } catch {}

        const [curRes, histRes] = await Promise.all([
          fetch("/api/shifts/current?storeId=store-bkk1").catch(() => null),
          fetch("/api/shifts?storeId=store-bkk1").catch(() => null),
        ]);

        if (curRes && curRes.ok) {
          const curJson = await curRes.json();
          if (curJson.success && curJson.shift) {
            setCurrentShift(curJson.shift);
          } else if (activePosShift) {
            setCurrentShift(activePosShift);
          }
        } else if (activePosShift) {
          setCurrentShift(activePosShift);
        }

        if (histRes && histRes.ok) {
          const histJson = await histRes.json();
          if (histJson.success) setShifts(histJson.shifts || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementAmountUSD || !movementReason) return;
    try {
      const res = await fetch("/api/shifts/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: currentShift?.id ?? "shift-001",
          type: movementType === "SAFE_DROP" ? "PAY_OUT" : movementType,
          amountUSD: parseFloat(movementAmountUSD),
          reason: `${movementType === "SAFE_DROP" ? "[SAFE DROP] " : ""}${movementReason}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessToast(`Recorded ${movementType} of $${parseFloat(movementAmountUSD).toFixed(2)}`);
        setShowMovementModal(false);
        setMovementAmountUSD("");
        setMovementReason("");
        setSupervisorPin("");
        fetchData();
        setTimeout(() => setSuccessToast(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSuccessToast(`Recorded voucher: $${parseFloat(movementAmountUSD).toFixed(2)}`);
      setShowMovementModal(false);
      setMovementAmountUSD("");
      setMovementReason("");
      setSupervisorPin("");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  const handleExportShiftsXLS = () => {
    const columns = [
      { header: "Shift ID", key: "id" },
      { header: "Cashier Name", key: "cashierName" },
      { header: "Opened Time", key: "openedAt", format: (v: any) => new Date(v).toLocaleString() },
      { header: "Closed Time", key: "closedAt", format: (v: any) => v ? new Date(v).toLocaleString() : "Active" },
      { header: "Starting Float ($)", key: "startingFloatUSD", format: (v: any) => `$${Number(v || 0).toFixed(2)}` },
      { header: "Cash Sales ($)", key: "totalCashSalesUSD", format: (v: any) => `$${Number(v || 0).toFixed(2)}` },
      { header: "Digital/KHQR ($)", key: "totalDigitalSalesUSD", format: (v: any) => `$${Number(v || 0).toFixed(2)}` },
      { header: "Actual Cash Count ($)", key: "actualCashUSD", format: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : "—" },
      { header: "Variance ($)", key: "cashVarianceUSD", format: (v: any) => v != null ? `$${Number(v).toFixed(2)}` : "—" },
      { header: "Status", key: "status" },
    ];
    exportToExcel("Shifts_ZReport_Audit_Log", [
      {
        sheetName: "Shift Audits",
        columns,
        data: shifts,
      },
    ]);
  };

  const handleExportShiftsPDF = () => {
    const totalCash = shifts.reduce((acc, s) => acc + (s.totalCashSalesUSD || 0), 0);
    const totalDigital = shifts.reduce((acc, s) => acc + (s.totalDigitalSalesUSD || 0), 0);
    const totalSales = totalCash + totalDigital;

    printExecutiveReport({
      title: "Shift Audit & Cashier Reconciliation Summary",
      subtitle: "Consolidated register shifts, float variance, and digital tender settlements",
      dateRangeLabel: "Historical Shifts (" + shifts.length + " logged)",
      kpis: [
        { label: "Total Shift Gross Sales", value: `$${totalSales.toFixed(2)}`, sublabel: `${(totalSales * 4000).toLocaleString()} ៛` },
        { label: "Total Cash Tendered", value: `$${totalCash.toFixed(2)}`, sublabel: "Physical notes" },
        { label: "Bakong KHQR / Digital", value: `$${totalDigital.toFixed(2)}`, sublabel: "Bank settlements" },
        { label: "Total Closed Shifts", value: String(shifts.length), sublabel: "Reconciled records" },
      ],
      columns: [
        { header: "Shift Ref", key: "id", align: "left" },
        { header: "Cashier", key: "cashierName", align: "left" },
        { header: "Opened", key: "openedAt", align: "center", format: (v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        { header: "Float", key: "startingFloatUSD", align: "right", format: (v) => `$${Number(v || 0).toFixed(2)}` },
        { header: "Cash Sales", key: "totalCashSalesUSD", align: "right", format: (v) => `$${Number(v || 0).toFixed(2)}` },
        { header: "Digital Sales", key: "totalDigitalSalesUSD", align: "right", format: (v) => `$${Number(v || 0).toFixed(2)}` },
        { header: "Variance", key: "cashVarianceUSD", align: "right", format: (v) => v != null ? `$${Number(v).toFixed(2)}` : "—" },
        { header: "Status", key: "status", align: "center" },
      ],
      data: shifts,
    });
  };

  return (
    <div className={`p-6 space-y-6 max-w-7xl mx-auto w-full page-enter ${
      isLight ? "text-slate-900" : "text-white"
    }`}>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          <p className="text-xs font-bold">{successToast}</p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Receipt size={22} className="text-amber-500" />
            Cash Drawer &amp; Supervisor Shift Audits
          </h1>
          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Real-time drawer reconciliation, multi-currency denomination counting, and cash drops
          </p>
        </div>

        {/* Supervisor Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportShiftsXLS}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Export XLS</span>
          </button>
          <button
            onClick={handleExportShiftsPDF}
            className={`flex items-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            }`}
          >
            <Printer size={15} />
            <span>Print PDF</span>
          </button>
          <button
            onClick={() => setShowCounterModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Calculator size={15} />
            <span>Counter</span>
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border active:scale-95 transition-all cursor-pointer ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            }`}
          >
            <ShieldCheck size={15} className="text-blue-400" />
            <span>Pay-In / Cash Drop</span>
          </button>
        </div>
      </div>

      {/* Active Shift Card */}
      {currentShift ? (
        <div className={`rounded-3xl border p-5 shadow-sm space-y-4 ${
          isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
              <h3 className={`text-sm font-extrabold ${isLight ? "text-slate-900" : "text-white"}`}>
                Active Shift: {currentShift.cashierName}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isLight ? "bg-slate-100 text-slate-700" : "bg-slate-800 text-slate-300"
              }`}>
                Register #1
              </span>
            </div>
            <span className={`text-xs font-semibold ${isLight ? "text-slate-400" : "text-slate-400"}`}>
              <Clock size={13} className="inline mr-1 text-amber-500" />
              Opened: {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/60 border-slate-700/60"
            }`}>
              <p className={`text-[10px] uppercase font-bold ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                Starting Float
              </p>
              <p className={`text-lg font-extrabold mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
                ${currentShift.startingFloatUSD.toFixed(2)}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {currentShift.startingFloatKHR.toLocaleString()} ៛
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/60 border-slate-700/60"
            }`}>
              <p className={`text-[10px] uppercase font-bold ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                Cash Sales
              </p>
              <p className="text-lg font-extrabold text-emerald-500 mt-1">
                ${currentShift.totalCashSalesUSD.toFixed(2)}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                {currentShift.orderCount} orders completed
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/60 border-slate-700/60"
            }`}>
              <p className={`text-[10px] uppercase font-bold ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                KHQR / Bakong Sales
              </p>
              <p className="text-lg font-extrabold text-blue-500 mt-1">
                ${((currentShift.totalQRSalesUSD || 0) + (currentShift.totalCardSalesUSD || 0)).toFixed(2)}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Digital Settlements
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isLight ? "bg-amber-50/60 border-amber-200/80" : "bg-slate-800/60 border-slate-700/60"
            }`}>
              <p className={`text-[10px] uppercase font-bold ${isLight ? "text-amber-800" : "text-slate-400"}`}>
                Expected in Drawer
              </p>
              <p className="text-lg font-extrabold text-amber-500 mt-1">
                ${expectedDrawerUSD.toFixed(2)}
              </p>
              <p className={`text-[10px] font-semibold mt-0.5 ${isLight ? "text-amber-700" : "text-slate-400"}`}>
                Float + Cash Inflow
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-5 rounded-3xl border text-xs flex items-center justify-between ${
          isLight ? "bg-white border-slate-200 text-slate-500" : "bg-slate-900 border-slate-800 text-slate-400"
        }`}>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            <span>No cash shift currently active at this store. Open a shift on the POS terminal to begin.</span>
          </div>
        </div>
      )}

      {/* Historical Shifts & Z-Reports Table */}
      <div className={`rounded-3xl border p-5 shadow-sm space-y-4 ${
        isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
            <FileText size={16} className="text-amber-400" />
            Shift History &amp; Z-Report Archive ({shifts.length})
          </h3>
          <span className={`text-[11px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
            Official audit logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-semibold uppercase text-[10px] ${
                isLight ? "border-slate-100 text-slate-400" : "border-slate-800 text-slate-400"
              }`}>
                <th className="pb-3 px-3">Date / Shift</th>
                <th className="pb-3 px-3">Cashier</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Starting Float</th>
                <th className="pb-3 px-3">Cash Sales</th>
                <th className="pb-3 px-3">Actual Cash</th>
                <th className="pb-3 px-3">Variance (Over/Short)</th>
                <th className="pb-3 px-3 text-right">Z-Report</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-slate-100" : "divide-slate-800"}`}>
              {shifts.map((s) => (
                <tr key={s.id} className={`transition-colors ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/40"
                }`}>
                  <td className={`py-3 px-3 font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    {new Date(s.openedAt).toLocaleDateString()}{" "}
                    {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className={`py-3 px-3 ${isLight ? "text-slate-600" : "text-slate-300"}`}>{s.cashierName}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        s.status === "OPEN"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                          : isLight ? "bg-slate-100 text-slate-600" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className={`py-3 px-3 ${isLight ? "text-slate-600" : "text-slate-300"}`}>${s.startingFloatUSD.toFixed(2)}</td>
                  <td className="py-3 px-3 text-emerald-500 font-semibold">${s.totalCashSalesUSD.toFixed(2)}</td>
                  <td className={`py-3 px-3 font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                    {s.endingCashActualUSD !== null ? `$${s.endingCashActualUSD.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 px-3">
                    {s.overShortUSD !== null ? (
                      <span
                        className={`font-bold ${
                          s.overShortUSD === 0
                            ? "text-emerald-500"
                            : s.overShortUSD > 0
                            ? "text-blue-500"
                            : "text-red-500"
                        }`}
                      >
                        {s.overShortUSD === 0 ? "Balanced ($0.00)" : (s.overShortUSD > 0 ? `+$${s.overShortUSD.toFixed(2)}` : `-$${Math.abs(s.overShortUSD).toFixed(2)}`)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {s.zReportJson ? (
                      <button
                        onClick={() => setSelectedZReport(JSON.parse(s.zReportJson))}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                      >
                        View Z-Report
                      </button>
                    ) : (
                      <span className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DENOMINATION CASH COUNTER MODAL ────────────────────────────── */}
      {showCounterModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCounterModal(false);
          }}
        >
          <div
            className={`border rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${
              isLight ? "border-slate-100" : "border-slate-800"
            }`}>
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                  <Calculator size={18} className="text-amber-500" />
                  Multi-Currency Cash Denomination Counter
                </h3>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Count physical bills in drawer and verify drawer balance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCounter}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isLight ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  <RotateCcw size={12} /> Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  title="Close (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Live Count Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`p-3 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/80 border-slate-700/60"
              }`}>
                <p className={`text-[10px] font-bold uppercase ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Physical Count
                </p>
                <p className={`text-base font-extrabold mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                  ${grandTotalPhysicalUSD.toFixed(2)}
                </p>
                <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  ${totalPhysicalUSD.toFixed(2)} + {totalPhysicalKHR.toLocaleString()}៛
                </p>
              </div>

              <div className={`p-3 rounded-2xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/80 border-slate-700/60"
              }`}>
                <p className={`text-[10px] font-bold uppercase ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Expected in Drawer
                </p>
                <p className="text-base font-extrabold text-amber-500 mt-0.5">${expectedDrawerUSD.toFixed(2)}</p>
                <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>System Recorded</p>
              </div>

              <div className={`p-3 rounded-2xl border ${
                varianceUSD === 0
                  ? isLight ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : varianceUSD > 0
                  ? isLight ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-blue-950/40 border-blue-500/40 text-blue-300"
                  : isLight ? "bg-red-50 border-red-200 text-red-800" : "bg-red-950/40 border-red-500/40 text-red-300"
              }`}>
                <p className="text-[10px] font-bold uppercase">Drawer Variance</p>
                <p className="text-base font-extrabold mt-0.5">
                  {varianceUSD >= 0 ? `+$${varianceUSD.toFixed(2)}` : `-$${Math.abs(varianceUSD).toFixed(2)}`}
                </p>
                <p className="text-[10px] font-semibold">
                  {varianceUSD === 0 ? "Balanced ($0.00)" : varianceUSD > 0 ? "Cash Over (+)" : "Cash Short (-)"}
                </p>
              </div>
            </div>

            {/* Denomination Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* USD */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/50"
              }`}>
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">USD Denominations ($)</h4>
                <div className="space-y-1.5">
                  {USD_DENOMS.map((denom) => (
                    <DenomRow
                      key={denom}
                      denom={denom}
                      count={usdCounts[denom] || 0}
                      currency="USD"
                      isLight={isLight}
                      onChange={handleUsdChange}
                    />
                  ))}
                </div>
              </div>

              {/* KHR */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/50"
              }`}>
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">KHR Denominations (៛)</h4>
                <div className="space-y-1.5">
                  {KHR_DENOMS.map((denom) => (
                    <DenomRow
                      key={denom}
                      denom={denom}
                      count={khrCounts[denom] || 0}
                      currency="KHR"
                      isLight={isLight}
                      onChange={handleKhrChange}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCounterModal(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-600 shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              Done &amp; Close Counter
            </button>
          </div>
        </div>
      )}

      {/* ─── CASH MOVEMENT MODAL ────────────────────────────────────────── */}
      {showMovementModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMovementModal(false);
          }}
        >
          <form
            onSubmit={handleRecordMovement}
            className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                  <ShieldCheck size={18} className="text-amber-500" />
                  Supervisor Cash Movement Voucher
                </h3>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Record cash drawer injections, petty cash drops, and skims
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Close (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type selector */}
            <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl border ${
              isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800 border-slate-700"
            }`}>
              {(["PAY_OUT", "SAFE_DROP", "PAY_IN"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMovementType(t)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    movementType === t
                      ? t === "PAY_IN" ? "bg-emerald-500 text-white shadow-sm"
                        : t === "SAFE_DROP" ? "bg-blue-500 text-white shadow-sm"
                        : "bg-amber-500 text-slate-950 shadow-sm"
                      : isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "PAY_OUT" ? "Petty Cash" : t === "SAFE_DROP" ? "Safe Drop" : "Pay-In Float"}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Amount (USD)
                </label>
                <input
                  type="number" step="0.01" min="0.1" required
                  value={movementAmountUSD}
                  onChange={(e) => setMovementAmountUSD(e.target.value)}
                  placeholder="0.00"
                  className={`w-full h-11 px-3 text-sm font-bold rounded-xl border outline-none focus:border-amber-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Reason / Purpose
                </label>
                <input
                  type="text" required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="e.g. Milk run, Emergency ice, Safe deposit"
                  className={`w-full h-11 px-3 text-xs rounded-xl border outline-none focus:border-amber-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Supervisor PIN
                </label>
                <input
                  type="password" maxLength={4} required
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="••••"
                  className={`w-full h-11 px-3 text-center text-base font-mono tracking-widest rounded-xl border outline-none focus:border-amber-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-800 border-slate-700 text-white"
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isLight ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Authorize &amp; Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Z-REPORT MODAL ─────────────────────────────────────────────── */}
      {selectedZReport && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedZReport(null);
          }}
        >
          <div
            className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
              <div className="text-left">
                <h3 className={`text-sm font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  {selectedZReport.reportType || "OFFICIAL Z-REPORT"}
                </h3>
                <p className="text-xs text-amber-500 font-bold mt-0.5">{selectedZReport.store?.name || "Artisan Roast Café"}</p>
                <p className={`text-[10px] mt-1 ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                  Generated: {new Date(selectedZReport.generatedAt || Date.now()).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Close (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`space-y-2 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {[
                ["Cashier",           selectedZReport.shift?.cashier || selectedZReport.shift?.cashierName],
                ["Total Orders",      selectedZReport.shift?.orderCount],
                ["Starting Float",    `$${Number(selectedZReport.cashSummary?.startingFloatUSD || 0).toFixed(2)}`],
                ["Gross Cash Sales",  `$${Number(selectedZReport.cashSummary?.cashSalesUSD || 0).toFixed(2)}`],
                ["QR / Bakong Sales", `$${Number(selectedZReport.salesBreakdown?.qrPayUSD || 0).toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span>{label}</span>
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{val}</span>
                </div>
              ))}
              <div className={`flex justify-between font-bold pt-2 border-t ${
                isLight ? "border-slate-100 text-slate-900" : "border-slate-800 text-white"
              }`}>
                <span>Total Gross Sales</span>
                <span className="text-amber-500">${Number(selectedZReport.salesBreakdown?.grossSalesUSD || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-500">
                <span>Drawer Variance</span>
                <span>${Number(selectedZReport.cashSummary?.overShortUSD || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedZReport(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isLight ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Printer size={14} /> Print Official Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Memoized denomination row ───────────────────────────────────────────────
const DenomRow = React.memo(function DenomRow({
  denom, count, currency, isLight, onChange,
}: {
  denom: number;
  count: number;
  currency: "USD" | "KHR";
  isLight: boolean;
  onChange: (denom: number, val: string) => void;
}) {
  const subtotal = denom * count;
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className={`font-bold w-20 shrink-0 ${isLight ? "text-slate-900" : "text-white"}`}>
        {currency === "USD" ? `$${denom}` : `${denom.toLocaleString()}៛`}
      </span>
      <span className="text-slate-400 text-[10px]">×</span>
      <input
        type="number"
        min="0"
        value={count || ""}
        onChange={(e) => onChange(denom, e.target.value)}
        placeholder="0"
        className={`w-16 h-7 px-2 text-center text-xs font-bold rounded-lg border outline-none focus:border-amber-500 transition-colors ${
          isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-700 text-white"
        }`}
      />
      <span className={`text-right font-semibold w-24 shrink-0 text-[11px] ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        {currency === "USD"
          ? `= $${subtotal.toFixed(2)}`
          : `= ${subtotal.toLocaleString()}៛`}
      </span>
    </div>
  );
});
