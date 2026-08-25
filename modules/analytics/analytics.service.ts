import { db } from "@/lib/db";

export class AnalyticsService {
  public static async getExecutiveSummary(storeId?: string) {
    const store = storeId ? db.stores.find((s) => s.id === storeId) : db.stores[0];
    const orders = storeId
      ? db.orders.filter((o) => o.storeId === storeId && o.status !== "CANCELLED")
      : db.orders.filter((o) => o.status !== "CANCELLED");

    const totalRevenueUSD = Number(orders.reduce((sum, o) => sum + o.total, 0).toFixed(2));
    const totalOrders = orders.length;
    const avgTicketUSD = totalOrders > 0 ? Number((totalRevenueUSD / totalOrders).toFixed(2)) : 0;

    let totalCOGS = 0;
    for (const order of orders) {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        totalCOGS += (prod?.costPrice || 0.5) * item.quantity;
      }
    }
    totalCOGS = Number(totalCOGS.toFixed(2));
    const grossProfitUSD = Number((totalRevenueUSD - totalCOGS).toFixed(2));
    const grossMarginPercent = totalRevenueUSD > 0 ? Number(((grossProfitUSD / totalRevenueUSD) * 100).toFixed(1)) : 0;

    // Hourly Sales Velocity (24 Hours)
    const hourlyVelocity: Array<{ hour: number; label: string; orders: number; revenue: number }> = [];
    for (let h = 6; h <= 22; h++) {
      const ampm = h >= 12 ? (h === 12 ? "12 PM" : `${h - 12} PM`) : `${h} AM`;
      hourlyVelocity.push({ hour: h, label: ampm, orders: 0, revenue: 0 });
    }

    for (const order of orders) {
      const h = new Date(order.createdAt).getHours();
      const bucket = hourlyVelocity.find((v) => v.hour === h);
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue = Number((bucket.revenue + order.total).toFixed(2));
      }
    }

    // Top Selling Products
    const productMap: Record<string, { productId: string; name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[item.productId].quantity += item.quantity;
        productMap[item.productId].revenue = Number((productMap[item.productId].revenue + item.totalPrice).toFixed(2));
      }
    }

    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    return {
      store: {
        id: store?.id,
        name: store?.name || "All Branches",
        khrRate: store?.khrRate || 4000,
      },
      summary: {
        totalRevenueUSD,
        totalRevenueKHR: Math.round(totalRevenueUSD * (store?.khrRate || 4000)),
        totalOrders,
        avgTicketUSD,
        totalCOGS,
        grossProfitUSD,
        grossMarginPercent,
      },
      hourlyVelocity,
      topProducts,
    };
  }
}
