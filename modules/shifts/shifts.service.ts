import { db } from "@/lib/db";
import { TelegramService } from "../telegram/telegram.service";

export interface OpenShiftPayload {
  storeId: string;
  cashierId: string;
  startingFloatUSD: number;
  startingFloatKHR: number;
  notes?: string;
}

export interface RecordCashMovementPayload {
  shiftId: string;
  type: "PAY_IN" | "PAY_OUT" | "CASH_DROP";
  amountUSD: number;
  amountKHR?: number;
  reason: string;
  authorizedById?: string;
}

export interface CloseShiftPayload {
  shiftId: string;
  endingCashActualUSD: number;
  endingCashActualKHR: number;
  notes?: string;
}

export class ShiftsService {
  public static async getCurrentShift(storeId = "store-bkk1") {
    const shift = db.cashShifts.find((s) => s.storeId === storeId && s.status === "OPEN");
    if (!shift) return null;

    const cashier = db.users.find((u) => u.id === shift.cashierId);
    const movements = db.cashMovements.filter((m) => m.shiftId === shift.id);

    const totalPayInUSD = movements.filter((m) => m.type === "PAY_IN").reduce((s, m) => s + m.amountUSD, 0);
    const totalPayOutUSD = movements.filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP").reduce((s, m) => s + m.amountUSD, 0);

    const expectedUSD = Number((shift.startingFloatUSD + shift.totalCashSalesUSD + totalPayInUSD - totalPayOutUSD).toFixed(2));
    const expectedKHR = Math.round(shift.startingFloatKHR + shift.totalCashSalesKHR);

    return {
      ...shift,
      cashierName: cashier?.name || "Staff",
      movements,
      calculated: {
        totalPayInUSD,
        totalPayOutUSD,
        expectedUSD,
        expectedKHR,
      },
    };
  }

  public static async openShift(payload: OpenShiftPayload) {
    const existing = db.cashShifts.find((s) => s.storeId === payload.storeId && s.status === "OPEN");
    if (existing) throw new Error("A cash shift is already active for this store. Close it first.");

    const shift = {
      id: `shift-${Date.now()}`,
      storeId: payload.storeId,
      cashierId: payload.cashierId,
      openedAt: new Date(),
      closedAt: null,
      status: "OPEN" as const,
      startingFloatUSD: payload.startingFloatUSD,
      startingFloatKHR: payload.startingFloatKHR,
      endingCashActualUSD: null,
      endingCashActualKHR: null,
      endingCashExpectedUSD: null,
      endingCashExpectedKHR: null,
      overShortUSD: null,
      overShortKHR: null,
      totalCashSalesUSD: 0,
      totalCashSalesKHR: 0,
      totalQRSalesUSD: 0,
      totalCardSalesUSD: 0,
      totalDiscountsUSD: 0,
      totalRefundsUSD: 0,
      orderCount: 0,
      zReportJson: null,
      notes: payload.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.cashShifts.push(shift);
    return shift;
  }

  public static async recordCashMovement(payload: RecordCashMovementPayload) {
    const shift = db.cashShifts.find((s) => s.id === payload.shiftId && s.status === "OPEN");
    if (!shift) throw new Error("Active shift not found");

    const movement = {
      id: `cm-${Date.now()}`,
      shiftId: shift.id,
      type: payload.type,
      amountUSD: payload.amountUSD,
      amountKHR: payload.amountKHR || 0,
      reason: payload.reason,
      authorizedById: payload.authorizedById || null,
      createdAt: new Date(),
    };

    db.cashMovements.push(movement);
    return movement;
  }

  public static async closeShift(payload: CloseShiftPayload) {
    const shift = db.cashShifts.find((s) => s.id === payload.shiftId && s.status === "OPEN");
    if (!shift) throw new Error("Shift not found or already closed");

    const store = db.stores.find((s) => s.id === shift.storeId) || db.stores[0];
    const cashier = db.users.find((u) => u.id === shift.cashierId);
    const movements = db.cashMovements.filter((m) => m.shiftId === shift.id);

    const totalPayInUSD = movements.filter((m) => m.type === "PAY_IN").reduce((s, m) => s + m.amountUSD, 0);
    const totalPayOutUSD = movements.filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP").reduce((s, m) => s + m.amountUSD, 0);

    const expectedUSD = Number((shift.startingFloatUSD + shift.totalCashSalesUSD + totalPayInUSD - totalPayOutUSD).toFixed(2));
    const expectedKHR = Math.round(shift.startingFloatKHR + shift.totalCashSalesKHR);

    const overShortUSD = Number((payload.endingCashActualUSD - expectedUSD).toFixed(2));
    const overShortKHR = Math.round(payload.endingCashActualKHR - expectedKHR);

    const grossSalesUSD = Number((shift.totalCashSalesUSD + shift.totalQRSalesUSD + shift.totalCardSalesUSD).toFixed(2));

    const zReport = {
      reportType: "OFFICIAL Z-REPORT (END OF DAY)",
      generatedAt: new Date().toISOString(),
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
      },
      shift: {
        id: shift.id,
        cashier: cashier?.name || "Staff",
        openedAt: shift.openedAt,
        closedAt: new Date().toISOString(),
        orderCount: shift.orderCount,
      },
      cashSummary: {
        startingFloatUSD: shift.startingFloatUSD,
        startingFloatKHR: shift.startingFloatKHR,
        totalPayInUSD,
        totalPayOutUSD,
        cashSalesUSD: shift.totalCashSalesUSD,
        cashSalesKHR: shift.totalCashSalesKHR,
        expectedCashUSD: expectedUSD,
        expectedCashKHR: expectedKHR,
        actualCashUSD: payload.endingCashActualUSD,
        actualCashKHR: payload.endingCashActualKHR,
        overShortUSD,
        overShortKHR,
      },
      salesBreakdown: {
        cashUSD: shift.totalCashSalesUSD,
        qrPayUSD: shift.totalQRSalesUSD,
        cardUSD: shift.totalCardSalesUSD,
        grossSalesUSD,
      },
      tax: Number((grossSalesUSD * 0.10).toFixed(2)),
    };

    shift.status = "CLOSED";
    shift.closedAt = new Date();
    shift.endingCashActualUSD = payload.endingCashActualUSD;
    shift.endingCashActualKHR = payload.endingCashActualKHR;
    shift.endingCashExpectedUSD = expectedUSD;
    shift.endingCashExpectedKHR = expectedKHR;
    shift.overShortUSD = overShortUSD;
    shift.overShortKHR = overShortKHR;
    shift.zReportJson = JSON.stringify(zReport);
    shift.updatedAt = new Date();

    // Dispatch instant Telegram Z-Report to Owner (#5)
    TelegramService.sendZReportSummary(store.tenantId, zReport).catch(console.error);

    return {
      shift,
      zReport,
    };
  }

  public static async getShiftHistory(storeId?: string) {
    const list = storeId ? db.cashShifts.filter((s) => s.storeId === storeId) : db.cashShifts;
    return list
      .map((s) => {
        const cashier = db.users.find((u) => u.id === s.cashierId);
        const store = db.stores.find((st) => st.id === s.storeId);
        return {
          ...s,
          cashierName: cashier?.name || "Staff",
          storeName: store?.name || "Store",
        };
      })
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }
}
