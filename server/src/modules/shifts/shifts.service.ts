import { mockDb } from "../../db/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";

export interface OpenShiftInput {
  storeId: string;
  cashierId: string;
  startingFloatUSD: number;
  startingFloatKHR: number;
  notes?: string;
}

export interface RecordMovementInput {
  shiftId: string;
  type: "PAY_IN" | "PAY_OUT" | "CASH_DROP";
  amountUSD: number;
  amountKHR?: number;
  reason: string;
  authorizedById?: string;
}

export interface CloseShiftInput {
  shiftId: string;
  endingCashActualUSD: number;
  endingCashActualKHR: number;
  notes?: string;
}

export class ShiftsService {
  async getCurrentShift(storeId: string) {
    const shift = mockDb.cashShifts.find(
      (s) => s.storeId === storeId && s.status === "OPEN"
    );
    if (!shift) return null;

    const movements = mockDb.cashMovements.filter((m) => m.shiftId === shift.id);
    const cashier = mockDb.users.find((u) => u.id === shift.cashierId);

    // Calculate current expected cash
    const totalPayInUSD = movements
      .filter((m) => m.type === "PAY_IN")
      .reduce((sum, m) => sum + m.amountUSD, 0);
    const totalPayInKHR = movements
      .filter((m) => m.type === "PAY_IN")
      .reduce((sum, m) => sum + m.amountKHR, 0);

    const totalPayOutUSD = movements
      .filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP")
      .reduce((sum, m) => sum + m.amountUSD, 0);
    const totalPayOutKHR = movements
      .filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP")
      .reduce((sum, m) => sum + m.amountKHR, 0);

    const expectedUSD = Number(
      (shift.startingFloatUSD + shift.totalCashSalesUSD + totalPayInUSD - totalPayOutUSD).toFixed(2)
    );
    const expectedKHR = Math.round(
      shift.startingFloatKHR + shift.totalCashSalesKHR + totalPayInKHR - totalPayOutKHR
    );

    return {
      ...shift,
      cashierName: cashier ? cashier.name : "Staff",
      movements,
      calculated: {
        totalPayInUSD,
        totalPayInKHR,
        totalPayOutUSD,
        totalPayOutKHR,
        expectedUSD,
        expectedKHR,
      },
    };
  }

  async openShift(input: OpenShiftInput) {
    const existing = mockDb.cashShifts.find(
      (s) => s.storeId === input.storeId && s.status === "OPEN"
    );
    if (existing) {
      throw new AppError("A cash shift is already open for this store. Close it first.", 400);
    }

    const shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeId: input.storeId,
      cashierId: input.cashierId,
      openedAt: new Date(),
      closedAt: null,
      status: "OPEN" as const,
      startingFloatUSD: input.startingFloatUSD,
      startingFloatKHR: input.startingFloatKHR,
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
      notes: input.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDb.cashShifts.push(shift);
    return shift;
  }

  async recordMovement(input: RecordMovementInput) {
    const shift = mockDb.cashShifts.find((s) => s.id === input.shiftId && s.status === "OPEN");
    if (!shift) {
      throw new AppError("Active shift not found", 404);
    }

    const movement = {
      id: `cm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shiftId: shift.id,
      type: input.type,
      amountUSD: input.amountUSD,
      amountKHR: input.amountKHR || 0,
      reason: input.reason,
      authorizedById: input.authorizedById || null,
      createdAt: new Date(),
    };

    mockDb.cashMovements.push(movement);
    return movement;
  }

  async closeShift(input: CloseShiftInput) {
    const shift = mockDb.cashShifts.find((s) => s.id === input.shiftId && s.status === "OPEN");
    if (!shift) {
      throw new AppError("Shift not found or already closed", 404);
    }

    const store = mockDb.stores.find((s) => s.id === shift.storeId) || mockDb.stores[0];
    const cashier = mockDb.users.find((u) => u.id === shift.cashierId);
    const movements = mockDb.cashMovements.filter((m) => m.shiftId === shift.id);
    const shiftOrders = mockDb.orders.filter((o) => o.shiftId === shift.id);

    // Sum cash movements
    const totalPayInUSD = movements
      .filter((m) => m.type === "PAY_IN")
      .reduce((sum, m) => sum + m.amountUSD, 0);
    const totalPayInKHR = movements
      .filter((m) => m.type === "PAY_IN")
      .reduce((sum, m) => sum + m.amountKHR, 0);

    const totalPayOutUSD = movements
      .filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP")
      .reduce((sum, m) => sum + m.amountUSD, 0);
    const totalPayOutKHR = movements
      .filter((m) => m.type === "PAY_OUT" || m.type === "CASH_DROP")
      .reduce((sum, m) => sum + m.amountKHR, 0);

    // Expected Drawer Balance
    const expectedUSD = Number(
      (shift.startingFloatUSD + shift.totalCashSalesUSD + totalPayInUSD - totalPayOutUSD).toFixed(2)
    );
    const expectedKHR = Math.round(
      shift.startingFloatKHR + shift.totalCashSalesKHR + totalPayInKHR - totalPayOutKHR
    );

    // Over / Short Discrepancy
    const overShortUSD = Number((input.endingCashActualUSD - expectedUSD).toFixed(2));
    const overShortKHR = Math.round(input.endingCashActualKHR - expectedKHR);

    const grossSalesUSD = Number(
      (shift.totalCashSalesUSD + shift.totalQRSalesUSD + shift.totalCardSalesUSD).toFixed(2)
    );

    const zReport = {
      reportType: "Z-REPORT (END OF SHIFT)",
      generatedAt: new Date().toISOString(),
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
      },
      shift: {
        id: shift.id,
        cashier: cashier ? cashier.name : "Staff",
        openedAt: shift.openedAt,
        closedAt: new Date().toISOString(),
        orderCount: shift.orderCount,
      },
      cashSummary: {
        startingFloatUSD: shift.startingFloatUSD,
        startingFloatKHR: shift.startingFloatKHR,
        totalPayInUSD,
        totalPayInKHR,
        totalPayOutUSD,
        totalPayOutKHR,
        cashSalesUSD: shift.totalCashSalesUSD,
        cashSalesKHR: shift.totalCashSalesKHR,
        expectedCashUSD: expectedUSD,
        expectedCashKHR: expectedKHR,
        actualCashUSD: input.endingCashActualUSD,
        actualCashKHR: input.endingCashActualKHR,
        overShortUSD,
        overShortKHR,
      },
      salesBreakdown: {
        cashUSD: shift.totalCashSalesUSD,
        qrPayUSD: shift.totalQRSalesUSD,
        cardUSD: shift.totalCardSalesUSD,
        grossSalesUSD,
      },
      taxAndDiscount: {
        taxCollectedUSD: Number((grossSalesUSD * 0.10).toFixed(2)),
        discountsGivenUSD: shift.totalDiscountsUSD,
      },
    };

    // Update Shift record
    shift.status = "CLOSED";
    shift.closedAt = new Date();
    shift.endingCashActualUSD = input.endingCashActualUSD;
    shift.endingCashActualKHR = input.endingCashActualKHR;
    shift.endingCashExpectedUSD = expectedUSD;
    shift.endingCashExpectedKHR = expectedKHR;
    shift.overShortUSD = overShortUSD;
    shift.overShortKHR = overShortKHR;
    shift.zReportJson = JSON.stringify(zReport);
    shift.notes = input.notes || shift.notes;
    shift.updatedAt = new Date();

    return {
      shift,
      zReport,
    };
  }

  async getZReport(shiftId: string) {
    const shift = mockDb.cashShifts.find((s) => s.id === shiftId);
    if (!shift) {
      throw new AppError("Shift not found", 404);
    }
    if (!shift.zReportJson) {
      throw new AppError("Shift has not been closed yet. Z-Report not generated.", 400);
    }
    return JSON.parse(shift.zReportJson);
  }
}

export const shiftsService = new ShiftsService();
