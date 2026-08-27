/**
 * Analytics Data Aggregation Utility
 * Transforms raw POS orders and store items into structured hourly and daily metrics,
 * product rankings, ingredient burn rates, and financial summaries.
 */

export interface RawOrderItem {
  name: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  total?: number;
  category?: string;
  modifiers?: string;
}

export interface RawPOSOrder {
  id: string;
  ticketNumber?: string;
  timestamp?: string;
  createdAt?: string;
  items: RawOrderItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  discountUSD?: number;
  paymentMethod?: string;
  status?: string;
  channel?: string;
}

export interface HourlyItemBreakdown {
  name: string;
  qty: number;
  revenueUSD: number;
  category: string;
}

export interface HourlyBucket {
  hour: number;
  label: string;
  windowTitle: string; // e.g. "8:00 AM – 9:00 AM Rush"
  revenueUSD: number;
  revenueKHR: number;
  orders: number;
  orderRatePerHour: number;
  avgTicketUSD: number;
  avgTransactionSpeedSec: number;
  isPeak: boolean;
  pctOfDaily: number;
  topSellingItems: HourlyItemBreakdown[];
  paymentSplit: {
    cashUSD: number;
    khqrUSD: number;
    cardUSD: number;
  };
}

export interface DailyBucket {
  dayKey: string; // e.g. "2026-08-21"
  label: string; // e.g. "Fri"
  windowTitle: string; // e.g. "Friday, Aug 21 Summary"
  revenueUSD: number;
  revenueKHR: number;
  orders: number;
  orderRatePerHour: number; // avg orders per open hour
  avgTicketUSD: number;
  avgTransactionSpeedSec: number;
  isPeak: boolean;
  pctOfDaily: number; // pct of 7-day total
  topSellingItems: HourlyItemBreakdown[];
  paymentSplit: {
    cashUSD: number;
    khqrUSD: number;
    cardUSD: number;
  };
}

export interface RankedProduct {
  name: string;
  category: string;
  quantity: number;
  revenueUSD: number;
  revenueKHR: number;
  relativeVolumePct: number; // relative to #1 product
  shareOfTotalPct: number;   // share of overall volume
}

export interface IngredientUsage {
  id: string;
  name: string;
  icon: string;
  category: string;
  currentUsed: number;
  capacity: number;
  unit: string;
  depletionPct: number;
  status: "healthy" | "moderate" | "critical" | "po_issued";
  statusLabel: string;
  burnRatePerOrder: number;
  hoursUntilDepletion: number;
  depletionVelocityPerHour: number;
  reorderSKU: string;
  supplierName: string;
  reorderPackSize: string;
  suggestedReorderQty: number;
  reorderEstimatedCostUSD: number;
}

export interface StaffUtilization {
  id: string;
  name: string;
  role: string;
  shift: string;
  avatarBg: string;
  ticketsPerHour: number;
  activeTimePct: number;
  idleTimePct: number;
  totalRevenueHandledUSD: number;
  avgTicketTimeSec: number;
  status: "Active" | "Break" | "Completed";
}

export interface AnalyticsSummary {
  dateRangeLabel: string;
  isWeeklyView: boolean;
  totalRevenueUSD: number;
  totalRevenueKHR: number;
  totalOrders: number;
  avgTicketUSD: number;
  totalItemsSold: number;
  grossProfitUSD: number;
  grossMarginPercent: number;
  totalCOGSUSD: number;
  peakHourLabel: string;
  peakHourRevenueUSD: number;
  peakHourOrders: number;
  hourlyData: HourlyBucket[];
  dailyData: DailyBucket[];
  topProducts: RankedProduct[];
  ingredients: IngredientUsage[];
  staff: StaffUtilization[];
  tenderBreakdown: {
    cashUSD: number;
    cashKHR: number;
    khqrUSD: number;
    cardUSD: number;
  };
}

export const KHR_EXCHANGE_RATE = 4100;

export const STANDARD_HOURS = [
  { hour: 6, label: "6 AM", windowTitle: "6:00 AM – 7:00 AM (Opening)" },
  { hour: 7, label: "7 AM", windowTitle: "7:00 AM – 8:00 AM (Early Rush)" },
  { hour: 8, label: "8 AM", windowTitle: "8:00 AM – 9:00 AM (Morning Peak)" },
  { hour: 9, label: "9 AM", windowTitle: "9:00 AM – 10:00 AM (Morning Rush)" },
  { hour: 10, label: "10 AM", windowTitle: "10:00 AM – 11:00 AM (Mid-Morning)" },
  { hour: 11, label: "11 AM", windowTitle: "11:00 AM – 12:00 PM (Pre-Lunch)" },
  { hour: 12, label: "12 PM", windowTitle: "12:00 PM – 1:00 PM (Lunch Rush)" },
  { hour: 13, label: "1 PM", windowTitle: "1:00 PM – 2:00 PM (After-Lunch)" },
  { hour: 14, label: "2 PM", windowTitle: "2:00 PM – 3:00 PM (Afternoon Dip)" },
  { hour: 15, label: "3 PM", windowTitle: "3:00 PM – 4:00 PM (Afternoon Coffee)" },
  { hour: 16, label: "4 PM", windowTitle: "4:00 PM – 5:00 PM (Late Afternoon)" },
  { hour: 17, label: "5 PM", windowTitle: "5:00 PM – 6:00 PM (Evening Commute)" },
  { hour: 18, label: "6 PM", windowTitle: "6:00 PM – 7:00 PM (Evening Chill)" },
  { hour: 19, label: "7 PM", windowTitle: "7:00 PM – 8:00 PM (Dinner & Desserts)" },
  { hour: 20, label: "8 PM", windowTitle: "8:00 PM – 9:00 PM (Night Rush)" },
  { hour: 21, label: "9 PM", windowTitle: "9:00 PM – 10:00 PM (Closing)" },
];

/**
 * Calculates ingredient depletion status based on threshold rules:
 * - < 60%: Healthy (Green)
 * - 60% – 85%: Moderate (Amber)
 * - > 85%: Critical / Restock Alert (Red)
 */
export function getDepletionStatus(pct: number): { status: "healthy" | "moderate" | "critical"; statusLabel: string } {
  if (pct >= 85) {
    return { status: "critical", statusLabel: "Restock Alert" };
  }
  if (pct >= 60) {
    return { status: "moderate", statusLabel: "Moderate Usage" };
  }
  return { status: "healthy", statusLabel: "Healthy Stock" };
}

/**
 * Aggregates raw POS transactions and baseline café metrics into complete BOH analytics models.
 */
export function aggregatePOSAnalytics(
  posOrders: RawPOSOrder[],
  options: {
    datePreset?: "today" | "yesterday" | "7days" | "30days" | "custom";
    startDate?: string;
    endDate?: string;
    khrRate?: number;
  } = {}
): AnalyticsSummary {
  const khrRate = options.khrRate || KHR_EXCHANGE_RATE;
  const preset = options.datePreset || "today";
  const isWeeklyView = preset === "7days" || preset === "30days";

  // Filter non-voided valid orders
  const validOrders = posOrders.filter((o) => o.status !== "Void" && o.status !== "CANCELLED");

  // Multiplier for demo simulation if live orders are sparse
  const multiplier = preset === "yesterday" ? 0.92 : preset === "7days" ? 6.8 : preset === "30days" ? 28.5 : 1.0;

  // Base simulation weights for 6 AM - 9 PM curve
  const baselineRevenue = [
    18, 42, 115, 145, 98, 76, 85, 68, 54, 88, 92, 64, 48, 36, 22, 12,
  ].map((val) => Number((val * (preset === "7days" ? 1.0 : multiplier)).toFixed(2)));

  const baselineOrders = [
    3, 8, 22, 28, 18, 14, 16, 12, 10, 16, 17, 12, 9, 7, 4, 2,
  ].map((val) => Math.max(1, Math.round(val * (preset === "7days" ? 1.0 : multiplier))));

  // Simulated items per hour
  const defaultHourItems: Record<number, HourlyItemBreakdown[]> = {
    6: [
      { name: "Hot Americano", qty: 2, revenueUSD: 6.0, category: "Hot" },
      { name: "Butter Croissant", qty: 1, revenueUSD: 2.75, category: "Bakery" },
    ],
    7: [
      { name: "Cambodian Iced Coffee", qty: 5, revenueUSD: 17.5, category: "Iced" },
      { name: "Espresso Tonic", qty: 2, revenueUSD: 8.0, category: "Specialty" },
      { name: "Pain au Chocolat", qty: 1, revenueUSD: 3.25, category: "Bakery" },
    ],
    8: [
      { name: "Cambodian Iced Coffee", qty: 12, revenueUSD: 42.0, category: "Iced" },
      { name: "Oat Milk Latte", qty: 8, revenueUSD: 36.0, category: "Hot" },
      { name: "Espresso Tonic", qty: 4, revenueUSD: 16.0, category: "Specialty" },
      { name: "Almond Croissant", qty: 3, revenueUSD: 10.5, category: "Bakery" },
    ],
    9: [
      { name: "Cambodian Iced Coffee", qty: 16, revenueUSD: 56.0, category: "Iced" },
      { name: "Espresso Tonic", qty: 9, revenueUSD: 36.0, category: "Specialty" },
      { name: "Oat Milk Latte", qty: 7, revenueUSD: 31.5, category: "Hot" },
      { name: "Cold Brew Float", qty: 4, revenueUSD: 20.0, category: "Iced" },
    ],
    10: [
      { name: "Matcha Latte", qty: 6, revenueUSD: 28.5, category: "Specialty" },
      { name: "Cambodian Iced Coffee", qty: 8, revenueUSD: 28.0, category: "Iced" },
      { name: "Caramel Macchiato", qty: 5, revenueUSD: 21.25, category: "Hot" },
    ],
    11: [
      { name: "Espresso Tonic", qty: 5, revenueUSD: 20.0, category: "Specialty" },
      { name: "Cold Brew Float", qty: 4, revenueUSD: 20.0, category: "Iced" },
      { name: "Croissant Breakfast Combo", qty: 3, revenueUSD: 19.5, category: "Combos" },
    ],
    12: [
      { name: "Croissant Breakfast Combo", qty: 8, revenueUSD: 52.0, category: "Combos" },
      { name: "Cambodian Iced Coffee", qty: 6, revenueUSD: 21.0, category: "Iced" },
      { name: "Passion Fruit Tea", qty: 3, revenueUSD: 9.75, category: "Tea" },
    ],
    13: [
      { name: "Cold Brew Float", qty: 5, revenueUSD: 25.0, category: "Iced" },
      { name: "Matcha Latte", qty: 4, revenueUSD: 19.0, category: "Specialty" },
      { name: "Espresso Tonic", qty: 3, revenueUSD: 12.0, category: "Specialty" },
    ],
    14: [
      { name: "Cambodian Iced Coffee", qty: 6, revenueUSD: 21.0, category: "Iced" },
      { name: "Hot Americano", qty: 4, revenueUSD: 12.0, category: "Hot" },
    ],
    15: [
      { name: "Oat Milk Latte", qty: 7, revenueUSD: 31.5, category: "Hot" },
      { name: "Matcha Latte", qty: 5, revenueUSD: 23.75, category: "Specialty" },
      { name: "Caramel Macchiato", qty: 4, revenueUSD: 17.0, category: "Hot" },
    ],
    16: [
      { name: "Cambodian Iced Coffee", qty: 8, revenueUSD: 28.0, category: "Iced" },
      { name: "Espresso Tonic", qty: 6, revenueUSD: 24.0, category: "Specialty" },
      { name: "Cold Brew Float", qty: 4, revenueUSD: 20.0, category: "Iced" },
    ],
    17: [
      { name: "Caramel Macchiato", qty: 5, revenueUSD: 21.25, category: "Hot" },
      { name: "Matcha Latte", qty: 4, revenueUSD: 19.0, category: "Specialty" },
    ],
    18: [
      { name: "Hot Americano", qty: 4, revenueUSD: 12.0, category: "Hot" },
      { name: "Cold Brew Float", qty: 3, revenueUSD: 15.0, category: "Iced" },
    ],
    19: [
      { name: "Matcha Latte", qty: 3, revenueUSD: 14.25, category: "Specialty" },
      { name: "Hot Latte", qty: 3, revenueUSD: 12.0, category: "Hot" },
    ],
    20: [
      { name: "Hot Americano", qty: 3, revenueUSD: 9.0, category: "Hot" },
      { name: "Chamomile Tea", qty: 2, revenueUSD: 6.0, category: "Tea" },
    ],
    21: [
      { name: "Hot Americano", qty: 2, revenueUSD: 6.0, category: "Hot" },
    ],
  };

  // Initialize hourly buckets map
  const hourlyMap: Record<
    number,
    {
      revenueUSD: number;
      orders: number;
      items: Record<string, HourlyItemBreakdown>;
      cashUSD: number;
      khqrUSD: number;
      cardUSD: number;
    }
  > = {};

  STANDARD_HOURS.forEach((h, idx) => {
    const rev = baselineRevenue[idx] || 0;
    const ords = baselineOrders[idx] || 0;
    const defaultItemsMap: Record<string, HourlyItemBreakdown> = {};
    (defaultHourItems[h.hour] || []).forEach((it) => {
      defaultItemsMap[it.name] = {
        name: it.name,
        qty: Math.max(1, Math.round(it.qty * (preset === "7days" ? 1.0 : multiplier))),
        revenueUSD: Number((it.revenueUSD * (preset === "7days" ? 1.0 : multiplier)).toFixed(2)),
        category: it.category,
      };
    });

    hourlyMap[h.hour] = {
      revenueUSD: rev,
      orders: ords,
      items: defaultItemsMap,
      cashUSD: Number((rev * 0.35).toFixed(2)),
      khqrUSD: Number((rev * 0.55).toFixed(2)),
      cardUSD: Number((rev * 0.1).toFixed(2)),
    };
  });

  // ── 7-Day Simulation Buckets ────────────────────────────────────────────────
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const baselineDailyRev = [680, 740, 810, 860, 950, 1140, 780];
  const baselineDailyOrders = [118, 126, 138, 145, 162, 192, 132];

  let maxDayRev = 0;
  let peakDayIdx = 5; // Saturday

  baselineDailyRev.forEach((rev, idx) => {
    if (rev > maxDayRev) {
      maxDayRev = rev;
      peakDayIdx = idx;
    }
  });

  const total7DayRevenueUSD = baselineDailyRev.reduce((s, r) => s + r, 0);

  const dailyData: DailyBucket[] = daysOfWeek.map((d, idx) => {
    const rev = baselineDailyRev[idx];
    const ords = baselineDailyOrders[idx];
    const isPeak = idx === peakDayIdx;
    const pctOfDaily = Number(((rev / total7DayRevenueUSD) * 100).toFixed(1));

    return {
      dayKey: `DAY-${idx + 1}`,
      label: d,
      windowTitle: `${d} Full Day Sales Summary`,
      revenueUSD: rev,
      revenueKHR: Math.round(rev * khrRate),
      orders: ords,
      orderRatePerHour: Number((ords / 16).toFixed(1)),
      avgTicketUSD: Number((rev / ords).toFixed(2)),
      avgTransactionSpeedSec: isPeak ? 34 : 44,
      isPeak,
      pctOfDaily,
      topSellingItems: [
        { name: "Cambodian Iced Coffee", qty: Math.round(ords * 0.28), revenueUSD: Number((ords * 0.28 * 3.5).toFixed(2)), category: "Iced" },
        { name: "Espresso Tonic", qty: Math.round(ords * 0.19), revenueUSD: Number((ords * 0.19 * 4.0).toFixed(2)), category: "Specialty" },
        { name: "Oat Milk Latte", qty: Math.round(ords * 0.17), revenueUSD: Number((ords * 0.17 * 4.5).toFixed(2)), category: "Hot" },
        { name: "Croissant Breakfast Combo", qty: Math.round(ords * 0.12), revenueUSD: Number((ords * 0.12 * 6.5).toFixed(2)), category: "Combos" },
      ],
      paymentSplit: {
        cashUSD: Number((rev * 0.34).toFixed(2)),
        khqrUSD: Number((rev * 0.58).toFixed(2)),
        cardUSD: Number((rev * 0.08).toFixed(2)),
      },
    };
  });

  // Top products overall map
  const productMap: Record<string, { name: string; category: string; quantity: number; revenueUSD: number }> = {
    "Cambodian Iced Coffee": {
      name: "Cambodian Iced Coffee",
      category: "Iced Coffee",
      quantity: Math.round(42 * multiplier),
      revenueUSD: Number((42 * multiplier * 3.5).toFixed(2)),
    },
    "Espresso Tonic": {
      name: "Espresso Tonic",
      category: "Specialty",
      quantity: Math.round(29 * multiplier),
      revenueUSD: Number((29 * multiplier * 4.0).toFixed(2)),
    },
    "Oat Milk Latte": {
      name: "Oat Milk Latte",
      category: "Hot Coffee",
      quantity: Math.round(26 * multiplier),
      revenueUSD: Number((26 * multiplier * 4.5).toFixed(2)),
    },
    "Cold Brew Float": {
      name: "Cold Brew Float",
      category: "Iced Coffee",
      quantity: Math.round(21 * multiplier),
      revenueUSD: Number((21 * multiplier * 5.0).toFixed(2)),
    },
    "Matcha Latte": {
      name: "Matcha Latte",
      category: "Specialty Tea",
      quantity: Math.round(18 * multiplier),
      revenueUSD: Number((18 * multiplier * 4.75).toFixed(2)),
    },
    "Caramel Macchiato": {
      name: "Caramel Macchiato",
      category: "Hot Coffee",
      quantity: Math.round(15 * multiplier),
      revenueUSD: Number((15 * multiplier * 4.25).toFixed(2)),
    },
  };

  let liveRevenueUSD = 0;
  let liveOrdersCount = 0;
  let liveCashUSD = 0;
  let liveCashKHR = 0;
  let liveKhqrUSD = 0;
  let liveCardUSD = 0;

  // Process live POS orders
  validOrders.forEach((ord) => {
    const total = ord.total || 0;
    liveRevenueUSD += total;
    liveOrdersCount += 1;

    // Tender categorization
    const method = (ord.paymentMethod || "CASH").toUpperCase();
    let isCash = false;
    let isKhqr = false;
    let isCard = false;

    if (method.includes("CASH")) {
      isCash = true;
      liveCashUSD += total;
      liveCashKHR += Math.round(total * khrRate);
    } else if (method.includes("KHQR") || method.includes("BAKONG")) {
      isKhqr = true;
      liveKhqrUSD += total;
    } else {
      isCard = true;
      liveCardUSD += total;
    }

    // Determine hour bucket
    let hour = 9;
    if (ord.createdAt) {
      hour = new Date(ord.createdAt).getHours();
    } else if (ord.timestamp) {
      const match = ord.timestamp.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1]);
        const isPM = (match[3] || "").toUpperCase() === "PM";
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        hour = h;
      }
    }

    // Clamp hour to 6..21
    if (hour < 6) hour = 6;
    if (hour > 21) hour = 21;

    if (hourlyMap[hour]) {
      hourlyMap[hour].revenueUSD += total;
      hourlyMap[hour].orders += 1;
      if (isCash) hourlyMap[hour].cashUSD += total;
      if (isKhqr) hourlyMap[hour].khqrUSD += total;
      if (isCard) hourlyMap[hour].cardUSD += total;

      // Process items inside hourly breakdown
      (ord.items || []).forEach((item) => {
        const qty = item.qty || item.quantity || 1;
        const unitPrice = item.unitPrice || item.price || (qty > 0 ? (item.total || 0) / qty : 3.5);
        const totalItemRev = item.total || unitPrice * qty;
        const name = item.name || "Specialty Brew";

        if (!hourlyMap[hour].items[name]) {
          hourlyMap[hour].items[name] = {
            name,
            qty: 0,
            revenueUSD: 0,
            category: item.category || "Coffee",
          };
        }
        hourlyMap[hour].items[name].qty += qty;
        hourlyMap[hour].items[name].revenueUSD += totalItemRev;

        // Overall product map
        if (!productMap[name]) {
          productMap[name] = {
            name,
            category: item.category || "Coffee",
            quantity: 0,
            revenueUSD: 0,
          };
        }
        productMap[name].quantity += qty;
        productMap[name].revenueUSD = Number((productMap[name].revenueUSD + totalItemRev).toFixed(2));
      });
    }
  });

  // Calculate totals and peak hour
  let grandTotalRevenueUSD = 0;
  let grandTotalOrders = 0;
  let maxHourlyRev = 0;
  let peakHourNum = 9;

  if (isWeeklyView) {
    grandTotalRevenueUSD = total7DayRevenueUSD;
    grandTotalOrders = baselineDailyOrders.reduce((s, o) => s + o, 0);
  } else {
    STANDARD_HOURS.forEach((h) => {
      const bucket = hourlyMap[h.hour];
      grandTotalRevenueUSD += bucket.revenueUSD;
      grandTotalOrders += bucket.orders;
      if (bucket.revenueUSD > maxHourlyRev) {
        maxHourlyRev = bucket.revenueUSD;
        peakHourNum = h.hour;
      }
    });
  }

  grandTotalRevenueUSD = Number(grandTotalRevenueUSD.toFixed(2));
  const grandTotalRevenueKHR = Math.round(grandTotalRevenueUSD * khrRate);
  const avgTicketUSD = grandTotalOrders > 0 ? Number((grandTotalRevenueUSD / grandTotalOrders).toFixed(2)) : 0;

  // Build final HourlyBuckets
  const hourlyData: HourlyBucket[] = STANDARD_HOURS.map((h) => {
    const bucket = hourlyMap[h.hour];
    const isPeak = h.hour === peakHourNum;
    const pctOfDaily = grandTotalRevenueUSD > 0 ? Number(((bucket.revenueUSD / grandTotalRevenueUSD) * 100).toFixed(1)) : 0;
    const avgTicket = bucket.orders > 0 ? Number((bucket.revenueUSD / bucket.orders).toFixed(2)) : 0;

    const speedSec = isPeak ? 36 : bucket.orders > 15 ? 42 : 52;

    const topItems = Object.values(bucket.items)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4)
      .map((it) => ({
        ...it,
        revenueUSD: Number(it.revenueUSD.toFixed(2)),
      }));

    return {
      hour: h.hour,
      label: h.label,
      windowTitle: h.windowTitle,
      revenueUSD: Number(bucket.revenueUSD.toFixed(2)),
      revenueKHR: Math.round(bucket.revenueUSD * khrRate),
      orders: bucket.orders,
      orderRatePerHour: bucket.orders,
      avgTicketUSD: avgTicket,
      avgTransactionSpeedSec: speedSec,
      isPeak,
      pctOfDaily,
      topSellingItems: topItems,
      paymentSplit: {
        cashUSD: Number(bucket.cashUSD.toFixed(2)),
        khqrUSD: Number(bucket.khqrUSD.toFixed(2)),
        cardUSD: Number(bucket.cardUSD.toFixed(2)),
      },
    };
  });

  const peakHourBucket = isWeeklyView
    ? {
        label: dailyData[peakDayIdx].label,
        revenueUSD: dailyData[peakDayIdx].revenueUSD,
        orders: dailyData[peakDayIdx].orders,
      }
    : hourlyData.find((h) => h.isPeak) || hourlyData[3];

  // Top products ranking
  const allProducts = Object.values(productMap).sort((a, b) => b.revenueUSD - a.revenueUSD);
  const topProductVolume = allProducts[0]?.quantity || 1;
  const totalItemsSold = allProducts.reduce((sum, p) => sum + p.quantity, 0);

  const topProducts: RankedProduct[] = allProducts.slice(0, 6).map((p) => ({
    name: p.name,
    category: p.category,
    quantity: p.quantity,
    revenueUSD: Number(p.revenueUSD.toFixed(2)),
    revenueKHR: Math.round(p.revenueUSD * khrRate),
    relativeVolumePct: Math.round((p.quantity / topProductVolume) * 100),
    shareOfTotalPct: totalItemsSold > 0 ? Number(((p.quantity / totalItemsSold) * 100).toFixed(1)) : 0,
  }));

  // Financial COGS & Margin calculation
  const totalCOGSUSD = Number((grandTotalRevenueUSD * 0.315).toFixed(2));
  const grossProfitUSD = Number((grandTotalRevenueUSD - totalCOGSUSD).toFixed(2));
  const grossMarginPercent = grandTotalRevenueUSD > 0 ? Number(((grossProfitUSD / grandTotalRevenueUSD) * 100).toFixed(1)) : 68.5;

  // Ingredient Burn & Depletion Velocity Calculation
  const totalCoffeeDrinks = Math.round(totalItemsSold * 0.85);
  const totalMilkDrinks = Math.round(totalItemsSold * 0.55);
  const totalOatDrinks = Math.round(totalItemsSold * 0.22);
  const totalSyrupDrinks = Math.round(totalItemsSold * 0.35);

  const beansBurnKg = Number((totalCoffeeDrinks * 0.018).toFixed(2));
  const milkBurnL = Number((totalMilkDrinks * 0.16).toFixed(1));
  const oatMilkBurnL = Number((totalOatDrinks * 0.18).toFixed(1));
  const syrupBurnL = Number((totalSyrupDrinks * 0.02).toFixed(1));
  const cupsBurnPcs = totalItemsSold;
  const iceBurnKg = Number((totalItemsSold * 0.12).toFixed(1));

  const currentElapsedHours = 7;
  const avgHourlyBurn = (burn: number) => Number((burn / Math.max(currentElapsedHours, 1)).toFixed(2));

  const ingredientsConfig = [
    {
      id: "beans",
      name: "House Espresso Beans",
      icon: "🫘",
      category: "Coffee Beans",
      currentUsed: beansBurnKg,
      capacity: Number((3.5 * multiplier).toFixed(1)),
      unit: "kg",
      burnRatePerOrder: 0.018,
      reorderSKU: "SKU-BEANS-01",
      supplierName: "Mondulkiri Roastery Co.",
      reorderPackSize: "5 kg Bulk Bag",
      suggestedReorderQty: 2,
      reorderEstimatedCostUSD: 48.0,
    },
    {
      id: "milk",
      name: "Pasteurized Whole Milk",
      icon: "🥛",
      category: "Dairy",
      currentUsed: milkBurnL,
      capacity: Number((18.0 * multiplier).toFixed(1)),
      unit: "L",
      burnRatePerOrder: 0.16,
      reorderSKU: "SKU-MILK-DAIRY",
      supplierName: "Angkor Fresh Dairy",
      reorderPackSize: "12 x 1L Case",
      suggestedReorderQty: 2,
      reorderEstimatedCostUSD: 36.0,
    },
    {
      id: "oatmilk",
      name: "Oatbed Barista Edition",
      icon: "🌾",
      category: "Alt Milk",
      currentUsed: oatMilkBurnL,
      capacity: Number((6.0 * multiplier).toFixed(1)),
      unit: "L",
      burnRatePerOrder: 0.18,
      reorderSKU: "SKU-OAT-BARISTA",
      supplierName: "Oatbed Asia Distribution",
      reorderPackSize: "6 x 1L Carton",
      suggestedReorderQty: 3,
      reorderEstimatedCostUSD: 42.0,
    },
    {
      id: "syrup",
      name: "Madagascar Vanilla Syrup",
      icon: "🍯",
      category: "Flavors",
      currentUsed: syrupBurnL,
      capacity: Number((2.5 * multiplier).toFixed(1)),
      unit: "L",
      burnRatePerOrder: 0.02,
      reorderSKU: "SKU-SYRUP-VAN",
      supplierName: "Monin Indochina",
      reorderPackSize: "1L Glass Bottle",
      suggestedReorderQty: 4,
      reorderEstimatedCostUSD: 28.0,
    },
    {
      id: "cups",
      name: "16oz Compostable Cups & Lids",
      icon: "🥤",
      category: "Packaging",
      currentUsed: cupsBurnPcs,
      capacity: Math.round(200 * multiplier),
      unit: "pcs",
      burnRatePerOrder: 1,
      reorderSKU: "SKU-CUP-16OZ",
      supplierName: "EcoPack Cambodia",
      reorderPackSize: "500 pcs Sleeve Case",
      suggestedReorderQty: 1,
      reorderEstimatedCostUSD: 32.5,
    },
    {
      id: "ice",
      name: "Filtered Pure Tube Ice",
      icon: "🧊",
      category: "Ice & Cold",
      currentUsed: iceBurnKg,
      capacity: Number((25.0 * multiplier).toFixed(1)),
      unit: "kg",
      burnRatePerOrder: 0.12,
      reorderSKU: "SKU-ICE-TUBE",
      supplierName: "Phnom Penh Clean Ice Co.",
      reorderPackSize: "20 kg Insulated Bag",
      suggestedReorderQty: 2,
      reorderEstimatedCostUSD: 8.0,
    },
  ];

  const ingredients: IngredientUsage[] = ingredientsConfig.map((item) => {
    const depletionPct = Math.min(100, Math.round((item.currentUsed / Math.max(item.capacity, 0.1)) * 100));
    const { status, statusLabel } = getDepletionStatus(depletionPct);
    const velocity = avgHourlyBurn(item.currentUsed);
    const remaining = Math.max(0, item.capacity - item.currentUsed);
    const hoursLeft = velocity > 0 ? Number((remaining / velocity).toFixed(1)) : 8.0;

    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      category: item.category,
      currentUsed: item.currentUsed,
      capacity: item.capacity,
      unit: item.unit,
      depletionPct,
      status,
      statusLabel,
      burnRatePerOrder: item.burnRatePerOrder,
      hoursUntilDepletion: hoursLeft,
      depletionVelocityPerHour: velocity,
      reorderSKU: item.reorderSKU,
      supplierName: item.supplierName,
      reorderPackSize: item.reorderPackSize,
      suggestedReorderQty: item.suggestedReorderQty,
      reorderEstimatedCostUSD: item.reorderEstimatedCostUSD,
    };
  });

  // Staff Utilization Metrics
  const staff: StaffUtilization[] = [
    {
      id: "staff-01",
      name: "Dara",
      role: "Lead Cashier",
      shift: "Shift #1 (7:00 AM – 3:00 PM)",
      avatarBg: "bg-amber-600",
      ticketsPerHour: Number(((grandTotalOrders * 0.58) / (isWeeklyView ? 49 : 7)).toFixed(1)),
      activeTimePct: 84,
      idleTimePct: 16,
      totalRevenueHandledUSD: Number((grandTotalRevenueUSD * 0.62).toFixed(2)),
      avgTicketTimeSec: 38,
      status: "Active",
    },
    {
      id: "staff-02",
      name: "Sophea",
      role: "Head Barista",
      shift: "Shift #1 (7:00 AM – 3:00 PM)",
      avatarBg: "bg-emerald-600",
      ticketsPerHour: Number(((grandTotalOrders * 0.42) / (isWeeklyView ? 49 : 7)).toFixed(1)),
      activeTimePct: 91,
      idleTimePct: 9,
      totalRevenueHandledUSD: Number((grandTotalRevenueUSD * 0.38).toFixed(2)),
      avgTicketTimeSec: 54,
      status: "Active",
    },
    {
      id: "staff-03",
      name: "Channary",
      role: "Shift Supervisor",
      shift: "Floor Supervisor (8:00 AM – 4:00 PM)",
      avatarBg: "bg-indigo-600",
      ticketsPerHour: 6.4,
      activeTimePct: 76,
      idleTimePct: 24,
      totalRevenueHandledUSD: Number((grandTotalRevenueUSD * 0.15).toFixed(2)),
      avgTicketTimeSec: 46,
      status: "Active",
    },
  ];

  // Date range label
  let dateRangeLabel = "Today";
  if (preset === "yesterday") dateRangeLabel = "Yesterday";
  if (preset === "7days") dateRangeLabel = "Last 7 Days";
  if (preset === "30days") dateRangeLabel = "Last 30 Days";
  if (preset === "custom" && options.startDate && options.endDate) {
    dateRangeLabel = options.startDate === options.endDate ? options.startDate : `${options.startDate} to ${options.endDate}`;
  }

  return {
    dateRangeLabel,
    isWeeklyView,
    totalRevenueUSD: grandTotalRevenueUSD,
    totalRevenueKHR: grandTotalRevenueKHR,
    totalOrders: grandTotalOrders,
    avgTicketUSD,
    totalItemsSold,
    grossProfitUSD,
    grossMarginPercent,
    totalCOGSUSD,
    peakHourLabel: peakHourBucket.label,
    peakHourRevenueUSD: peakHourBucket.revenueUSD,
    peakHourOrders: peakHourBucket.orders,
    hourlyData,
    dailyData,
    topProducts,
    ingredients,
    staff,
    tenderBreakdown: {
      cashUSD: Number(liveCashUSD.toFixed(2)),
      cashKHR: liveCashKHR,
      khqrUSD: Number(liveKhqrUSD.toFixed(2)),
      cardUSD: Number(liveCardUSD.toFixed(2)),
    },
  };
}
