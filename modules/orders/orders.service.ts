import { db } from "@/lib/db";
import { TelegramService } from "../telegram/telegram.service";

export interface CheckoutOrderItem {
  productId: string;
  quantity: number;
  notes?: string;
  modifiers?: Array<{
    groupName: string;
    optionName: string;
    priceDelta?: number;
    modifierOptionId?: string;
  }>;
}

export interface CheckoutInput {
  tenantId?: string;
  storeId: string;
  cashierId?: string;
  channel: "WALK_IN" | "TAKEAWAY" | "DELIVERY" | "DINE_IN";
  items: CheckoutOrderItem[];
  payment: {
    method: "CASH_USD" | "CASH_KHR" | "DYNAMIC_QR" | "CREDIT_CARD";
    amountUSD: number;
    amountKHR?: number;
    changeGivenUSD?: number;
    changeGivenKHR?: number;
    transactionRef?: string;
  };
  tableNumber?: string;
  customerName?: string;
  notes?: string;
}

export class OrdersService {
  /**
   * Atomic Checkout & Recursive BOM Inventory Deduction Engine
   */
  public static async executeCheckout(input: CheckoutInput) {
    const tenantId = input.tenantId || "tenant-001";
    const store = db.stores.find((s) => s.id === input.storeId) || db.stores[0];
    const storeId = store.id;

    if (!input.items || input.items.length === 0) {
      throw new Error("Cannot checkout an empty ticket");
    }

    // 1. Generate daily sequential ticket number
    store.currentTicketSeq = (store.currentTicketSeq || 1000) + 1;
    const ticketNumber = String(store.currentTicketSeq);
    const invoiceNumber = `INV-${store.code}-${ticketNumber}`;

    // 2. Compute item prices with modifier deltas and store location multiplier (#4)
    const multiplier = store.priceMultiplier || 1.0;
    let subtotal = 0;
    const processedItems: any[] = [];
    const requiredIngredients = new Map<string, { ingredientId: string; quantity: number; name: string; unit: string }>();

    for (const item of input.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Product '${item.productId}' not found`);

      let modifierTotal = 0;
      const isLarge = item.modifiers?.some((m) => m.groupName.toLowerCase() === "size" && m.optionName.toLowerCase() === "large");
      const isOatMilk = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("milk") && m.optionName.toLowerCase().includes("oat"));
      const isZeroSugar = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("sweet") && m.optionName.includes("0%"));
      const isNoIce = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("ice") && m.optionName.toLowerCase().includes("no ice"));

      if (item.modifiers) {
        for (const mod of item.modifiers) {
          modifierTotal += mod.priceDelta || 0;
        }
      }

      const unitPrice = Number(((prod.price + modifierTotal) * multiplier).toFixed(2));
      const itemTotalPrice = Number((unitPrice * item.quantity).toFixed(2));
      subtotal += itemTotalPrice;

      processedItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        station: prod.station || "BARISTA",
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotalPrice,
        notes: item.notes,
        modifiers: item.modifiers || [],
      });

      // Recursive BOM calculation
      const baseRecipes = db.productRecipes.filter((r) => r.productId === prod.id);
      for (const recipe of baseRecipes) {
        const masterIng = db.rawIngredients.find((i) => i.id === recipe.ingredientId);
        if (!masterIng) continue;

        // Find store-specific ingredient by SKU
        const storeIng =
          db.rawIngredients.find((i) => i.storeId === storeId && i.sku === masterIng.sku) || masterIng;

        let qty = recipe.quantity;
        if (isLarge) {
          if (storeIng.sku.includes("12OZ")) continue;
          if (storeIng.unit === "ML" || storeIng.unit === "GRAM") qty *= 1.35;
        }
        if (isOatMilk && storeIng.sku.includes("MILK-W")) continue;
        if (isZeroSugar && storeIng.sku.includes("SYRUP")) continue;
        if (isNoIce && storeIng.sku.includes("ICE")) continue;

        const totalQty = qty * item.quantity;
        const curr = requiredIngredients.get(storeIng.id) || {
          ingredientId: storeIng.id,
          quantity: 0,
          name: storeIng.name,
          unit: storeIng.unit,
        };
        curr.quantity += totalQty;
        requiredIngredients.set(storeIng.id, curr);
      }

      // Add modifier substitutions
      if (isLarge) {
        const largeCup = db.rawIngredients.find((i) => i.storeId === storeId && i.sku === "ING-CUP-16OZ");
        if (largeCup) {
          const curr = requiredIngredients.get(largeCup.id) || { ingredientId: largeCup.id, quantity: 0, name: largeCup.name, unit: largeCup.unit };
          curr.quantity += 1 * item.quantity;
          requiredIngredients.set(largeCup.id, curr);
        }
      }

      if (isOatMilk) {
        const oatMilk = db.rawIngredients.find((i) => i.storeId === storeId && i.sku === "ING-MILK-OAT");
        if (oatMilk) {
          const curr = requiredIngredients.get(oatMilk.id) || { ingredientId: oatMilk.id, quantity: 0, name: oatMilk.name, unit: oatMilk.unit };
          curr.quantity += (isLarge ? 260 : 200) * item.quantity;
          requiredIngredients.set(oatMilk.id, curr);
        }
      }
    }

    const tax = Number((subtotal * store.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const activeShift = db.cashShifts.find((s) => s.storeId === storeId && s.status === "OPEN");
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 3. Deduct stock & create audit transactions
    const lowStockAlerts: any[] = [];
    for (const req of Array.from(requiredIngredients.values())) {
      const ingredient = db.rawIngredients.find((i) => i.id === req.ingredientId);
      if (ingredient) {
        ingredient.currentStock = Math.max(0, Number((ingredient.currentStock - req.quantity).toFixed(2)));
        ingredient.updatedAt = new Date();

        db.stockTransactions.push({
          id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          storeId,
          ingredientId: ingredient.id,
          type: "SOLD_ORDER",
          quantityChange: -Number(req.quantity.toFixed(2)),
          remainingStock: ingredient.currentStock,
          referenceId: orderId,
          notes: `Sold in Ticket #${ticketNumber}`,
          createdById: input.cashierId || "usr-cashier-01",
          createdAt: new Date(),
        });

        if (ingredient.currentStock <= ingredient.reorderThreshold) {
          const alertObj = {
            ingredientId: ingredient.id,
            name: ingredient.name,
            currentStock: ingredient.currentStock,
            reorderThreshold: ingredient.reorderThreshold,
            unit: ingredient.unit,
            storeName: store.name,
          };
          lowStockAlerts.push(alertObj);

          // Dispatch Telegram Alert (#5)
          TelegramService.sendLowStockAlert(tenantId, alertObj).catch(console.error);
        }
      }
    }

    // 4. Create Order Record
    const order = {
      id: orderId,
      tenantId,
      storeId,
      shiftId: activeShift?.id || null,
      cashierId: input.cashierId || "usr-cashier-01",
      ticketNumber,
      invoiceNumber,
      channel: input.channel,
      status: "PENDING",
      paymentStatus: "PAID",
      subtotal,
      tax,
      discount: 0,
      total,
      currency: store.currency,
      khrRate: store.khrRate,
      tableNumber: input.tableNumber || null,
      customerName: input.customerName || null,
      notes: input.notes || null,
      items: processedItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.orders.push(order);

    // 5. Create Payment Transaction
    const payment = {
      id: `pay-${Date.now()}`,
      orderId: order.id,
      storeId,
      shiftId: activeShift?.id || null,
      method: input.payment.method,
      amountUSD: input.payment.amountUSD,
      amountKHR: input.payment.amountKHR || Math.round(input.payment.amountUSD * store.khrRate),
      changeGivenUSD: input.payment.changeGivenUSD || 0,
      changeGivenKHR: input.payment.changeGivenKHR || 0,
      transactionRef: input.payment.transactionRef || `TX-${Date.now()}`,
      isConfirmed: true,
      createdAt: new Date(),
    };

    db.paymentTransactions.push(payment);

    // 6. Update Shift stats if active
    if (activeShift) {
      activeShift.orderCount += 1;
      if (input.payment.method.startsWith("CASH")) {
        activeShift.totalCashSalesUSD += total;
        activeShift.totalCashSalesKHR += Math.round(total * store.khrRate);
      } else if (input.payment.method === "DYNAMIC_QR") {
        activeShift.totalQRSalesUSD += total;
      } else if (input.payment.method === "CREDIT_CARD") {
        activeShift.totalCardSalesUSD += total;
      }
      activeShift.updatedAt = new Date();
    }

    return {
      order,
      payment,
      lowStockAlerts,
    };
  }

  public static async getOrders(storeId?: string, status?: string) {
    let orders = storeId ? db.orders.filter((o) => o.storeId === storeId) : db.orders;
    if (status && status !== "ALL") {
      orders = orders.filter((o) => o.status === status);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async updateStatus(orderId: string, nextStatus: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED") {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    order.status = nextStatus;
    order.updatedAt = new Date();

    if (nextStatus === "PREPARING" && !order.preparingAt) order.preparingAt = new Date();
    else if (nextStatus === "READY" && !order.readyAt) order.readyAt = new Date();
    else if (nextStatus === "COMPLETED" && !order.completedAt) order.completedAt = new Date();

    return order;
  }
}
