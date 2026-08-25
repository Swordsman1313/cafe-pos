import { mockDb } from "../../db/prisma.js";

export class AnalyticsService {
  async getDashboardSummary(storeId: string) {
    const orders = mockDb.orders.filter(
      (o) => o.storeId === storeId && o.status !== "CANCELLED"
    );
    const store = mockDb.stores.find((s) => s.id === storeId) || mockDb.stores[0];

    const totalRevenueUSD = Number(
      orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)
    );
    const totalOrderCount = orders.length;
    const averageTicketUSD =
      totalOrderCount > 0 ? Number((totalRevenueUSD / totalOrderCount).toFixed(2)) : 0;

    // Calculate COGS and Gross Profit
    let totalCOGSUSD = 0;
    for (const order of orders) {
      for (const item of order.items) {
        const prod = mockDb.products.find((p) => p.id === item.productId);
        const itemCost = prod ? prod.costPrice : 0;
        totalCOGSUSD += itemCost * item.quantity;
      }
    }
    totalCOGSUSD = Number(totalCOGSUSD.toFixed(2));
    const grossProfitUSD = Number((totalRevenueUSD - totalCOGSUSD).toFixed(2));
    const grossMarginPercent =
      totalRevenueUSD > 0
        ? Number(((grossProfitUSD / totalRevenueUSD) * 100).toFixed(1))
        : 0;

    // Hourly Sales Velocity (24h buckets)
    const hourlyMap: Record<number, { hour: number; label: string; orders: number; revenue: number }> = {};
    for (let h = 6; h <= 22; h++) {
      const ampm = h >= 12 ? (h === 12 ? "12 PM" : `${h - 12} PM`) : `${h} AM`;
      hourlyMap[h] = { hour: h, label: ampm, orders: 0, revenue: 0 };
    }

    for (const order of orders) {
      const h = new Date(order.createdAt).getHours();
      if (hourlyMap[h]) {
        hourlyMap[h].orders += 1;
        hourlyMap[h].revenue = Number((hourlyMap[h].revenue + order.total).toFixed(2));
      }
    }
    const hourlyVelocity = Object.values(hourlyMap);

    // Top Selling Items
    const productStats: Record<string, { productId: string; name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].quantity += item.quantity;
        productStats[item.productId].revenue = Number(
          (productStats[item.productId].revenue + item.totalPrice).toFixed(2)
        );
      }
    }
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Ingredient Consumption Summary
    const ingredientStats = mockDb.rawIngredients
      .filter((i) => i.storeId === storeId)
      .map((ing) => {
        const soldTxs = mockDb.stockTransactions.filter(
          (t) => t.ingredientId === ing.id && t.type === "SOLD_ORDER"
        );
        const totalConsumed = Math.abs(
          soldTxs.reduce((sum, t) => sum + t.quantityChange, 0)
        );
        return {
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          currentStock: ing.currentStock,
          reorderThreshold: ing.reorderThreshold,
          totalConsumed: Number(totalConsumed.toFixed(2)),
          isLowStock: ing.currentStock <= ing.reorderThreshold,
        };
      });

    return {
      store: {
        id: store.id,
        name: store.name,
        currency: store.currency,
        khrRate: store.khrRate,
      },
      summary: {
        totalRevenueUSD,
        totalRevenueKHR: Math.round(totalRevenueUSD * store.khrRate),
        totalOrderCount,
        averageTicketUSD,
        totalCOGSUSD,
        grossProfitUSD,
        grossMarginPercent,
      },
      hourlyVelocity,
      topProducts,
      ingredientStats,
    };
  }
}

export const analyticsService = new AnalyticsService();
