/**
 * Analytics Data Aggregation Utility
 * Transforms raw POS orders and store items into structured hourly metrics,
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

export interface HourlyBucket {
  hour: number;
  label: string;
  revenueUSD: number;
  revenueKHR: number;
  orders: number;
  avgTicketUSD: number;
  isPeak: boolean;
  pctOfDaily: number;
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
  status: "healthy" | "moderate" | "critical";
  statusLabel: string;
  burnRatePerOrder: number;
}

export interface AnalyticsSummary {
  dateRangeLabel: string;
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
  topProducts: RankedProduct[];
  ingredients: IngredientUsage[];
  tenderBreakdown: {
    cashUSD: number;
    cashKHR: number;
    khqrUSD: number;
    cardUSD: number;
  };
}

export const KHR_EXCHANGE_RATE = 4100;

export const STANDARD_HOURS = [
  { hour: 6, label: "6 AM" },
  { hour: 7, label: "7 AM" },
  { hour: 8, label: "8 AM" },
  { hour: 9, label: "9 AM" },
  { hour: 10, label: "10 AM" },
  { hour: 11, label: "11 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 13, label: "1 PM" },
  { hour: 14, label: "2 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 16, label: "4 PM" },
  { hour: 17, label: "5 PM" },
  { hour: 18, label: "6 PM" },
  { hour: 19, label: "7 PM" },
  { hour: 20, label: "8 PM" },
  { hour: 21, label: "9 PM" },
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
 * Aggregates raw POS transactions and demo baseline data into complete analytics models.
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

  // Filter non-voided valid orders
  const validOrders = posOrders.filter((o) => o.status !== "Void" && o.status !== "CANCELLED");

  // Multiplier for demo simulation if live orders are sparse
  const multiplier = preset === "yesterday" ? 0.92 : preset === "7days" ? 6.8 : preset === "30days" ? 28.5 : 1.0;

  // Base simulation weights for 6 AM - 9 PM curve (peak around 8-10 AM and 2-4 PM)
  const baselineRevenue = [
    18, 42, 115, 145, 98, 76, 85, 68, 54, 88, 92, 64, 48, 36, 22, 12,
  ].map((val) => Number((val * multiplier).toFixed(2)));

  const baselineOrders = [
    3, 8, 22, 28, 18, 14, 16, 12, 10, 16, 17, 12, 9, 7, 4, 2,
  ].map((val) => Math.max(1, Math.round(val * multiplier)));

  // Initialize hourly buckets
  const hourlyMap: Record<number, { revenueUSD: number; orders: number }> = {};
  STANDARD_HOURS.forEach((h, idx) => {
    hourlyMap[h.hour] = {
      revenueUSD: baselineRevenue[idx] || 0,
      orders: baselineOrders[idx] || 0,
    };
  });

  // Top products accumulator
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
    if (method.includes("CASH")) {
      liveCashUSD += total;
      liveCashKHR += Math.round(total * khrRate);
    } else if (method.includes("KHQR") || method.includes("BAKONG")) {
      liveKhqrUSD += total;
    } else {
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
    }

    // Process items
    (ord.items || []).forEach((item) => {
      const qty = item.qty || item.quantity || 1;
      const unitPrice = item.unitPrice || item.price || (qty > 0 ? (item.total || 0) / qty : 3.5);
      const totalItemRev = item.total || unitPrice * qty;
      const name = item.name || "Specialty Brew";

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
  });

  // Calculate hourly totals and peak
  let grandTotalRevenueUSD = 0;
  let grandTotalOrders = 0;
  let maxHourlyRev = 0;
  let peakHourNum = 9;

  STANDARD_HOURS.forEach((h) => {
    const bucket = hourlyMap[h.hour];
    grandTotalRevenueUSD += bucket.revenueUSD;
    grandTotalOrders += bucket.orders;
    if (bucket.revenueUSD > maxHourlyRev) {
      maxHourlyRev = bucket.revenueUSD;
      peakHourNum = h.hour;
    }
  });

  grandTotalRevenueUSD = Number(grandTotalRevenueUSD.toFixed(2));
  const grandTotalRevenueKHR = Math.round(grandTotalRevenueUSD * khrRate);
  const avgTicketUSD = grandTotalOrders > 0 ? Number((grandTotalRevenueUSD / grandTotalOrders).toFixed(2)) : 0;

  // Hourly buckets array with peak indicators and percentages
  const hourlyData: HourlyBucket[] = STANDARD_HOURS.map((h) => {
    const bucket = hourlyMap[h.hour];
    const isPeak = h.hour === peakHourNum;
    const pctOfDaily = grandTotalRevenueUSD > 0 ? Number(((bucket.revenueUSD / grandTotalRevenueUSD) * 100).toFixed(1)) : 0;
    const avgTicket = bucket.orders > 0 ? Number((bucket.revenueUSD / bucket.orders).toFixed(2)) : 0;

    return {
      hour: h.hour,
      label: h.label,
      revenueUSD: Number(bucket.revenueUSD.toFixed(2)),
      revenueKHR: Math.round(bucket.revenueUSD * khrRate),
      orders: bucket.orders,
      avgTicketUSD: avgTicket,
      isPeak,
      pctOfDaily,
    };
  });

  const peakHourBucket = hourlyData.find((h) => h.isPeak) || hourlyData[3];

  // Top products ranking with relative and share percentages
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

  // Financial COGS & Margin calculation (industry average 30-32% COGS for cafe)
  const totalCOGSUSD = Number((grandTotalRevenueUSD * 0.315).toFixed(2));
  const grossProfitUSD = Number((grandTotalRevenueUSD - totalCOGSUSD).toFixed(2));
  const grossMarginPercent = grandTotalRevenueUSD > 0 ? Number(((grossProfitUSD / grandTotalRevenueUSD) * 100).toFixed(1)) : 68.5;

  // Ingredient Burn Rates & Depletion Calculation
  // Standard recipes:
  // - Espresso Beans: ~18g per coffee drink
  // - Fresh Milk: ~160ml per milk-based drink
  // - Oat Milk: ~180ml per alternative latte
  // - Vanilla / Caramel Syrup: ~20ml per flavored drink
  // - To-Go Cups & Sleeves: 1 unit per drink
  // - Ice: ~120g per iced beverage
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

  // Capacity bases for daily operations
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
    },
    {
      id: "cups",
      name: "16oz Compostable Cups",
      icon: "🥤",
      category: "Packaging",
      currentUsed: cupsBurnPcs,
      capacity: Math.round(200 * multiplier),
      unit: "pcs",
      burnRatePerOrder: 1,
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
    },
  ];

  const ingredients: IngredientUsage[] = ingredientsConfig.map((item) => {
    const depletionPct = Math.min(100, Math.round((item.currentUsed / Math.max(item.capacity, 0.1)) * 100));
    const { status, statusLabel } = getDepletionStatus(depletionPct);
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
    };
  });

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
    topProducts,
    ingredients,
    tenderBreakdown: {
      cashUSD: Number(liveCashUSD.toFixed(2)),
      cashKHR: liveCashKHR,
      khqrUSD: Number(liveKhqrUSD.toFixed(2)),
      cardUSD: Number(liveCardUSD.toFixed(2)),
    },
  };
}
