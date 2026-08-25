import { mockDb } from "../../db/prisma.js";
import { inventoryService } from "../inventory/inventory.service.js";
import { AppError } from "../../middleware/error.middleware.js";
import { getSocketGateway } from "../kds/kds.gateway.js";

export interface CreateOrderItemModifierInput {
  modifierOptionId: string;
  groupName: string;
  optionName: string;
  priceDelta?: number;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  modifiers?: CreateOrderItemModifierInput[];
}

export interface CreatePaymentInput {
  method: "CASH_USD" | "CASH_KHR" | "DYNAMIC_QR" | "CREDIT_CARD";
  amountUSD: number;
  amountKHR?: number;
  changeGivenUSD?: number;
  changeGivenKHR?: number;
  transactionRef?: string;
}

export interface CreateOrderInput {
  storeId: string;
  channel: "WALK_IN" | "TAKEAWAY" | "DELIVERY" | "DINE_IN";
  items: CreateOrderItemInput[];
  payment: CreatePaymentInput;
  tableNumber?: string;
  customerName?: string;
  notes?: string;
  cashierId?: string;
}

export class OrdersService {
  /**
   * Atomic checkout engine that records order, processes payment,
   * calculates recursive BOM deductions, updates inventory, and notifies KDS.
   */
  async createOrder(tenantId: string, input: CreateOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new AppError("Order must contain at least 1 item", 400);
    }

    const store = mockDb.stores.find((s) => s.id === input.storeId) || mockDb.stores[0];
    const storeId = store.id;

    // 1. Calculate sequential daily ticket sequence
    store.currentTicketSeq = (store.currentTicketSeq || 1000) + 1;
    const ticketNumber = String(store.currentTicketSeq);
    const invoiceNumber = `INV-${store.code}-${ticketNumber}`;

    // 2. Compute Item Totals & Verify Products
    let subtotal = 0;
    const processedItems: any[] = [];

    for (const itemInput of input.items) {
      const product = mockDb.products.find((p) => p.id === itemInput.productId);
      if (!product) {
        throw new AppError(`Product ID '${itemInput.productId}' not found`, 404);
      }

      let modifierTotal = 0;
      const itemModifiers: any[] = [];

      if (itemInput.modifiers && itemInput.modifiers.length > 0) {
        for (const mod of itemInput.modifiers) {
          const delta = mod.priceDelta !== undefined ? mod.priceDelta : 0;
          modifierTotal += delta;
          itemModifiers.push({
            id: `oim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            modifierOptionId: mod.modifierOptionId || "opt-custom",
            groupName: mod.groupName,
            optionName: mod.optionName,
            priceDelta: delta,
          });
        }
      }

      const unitPrice = product.price + modifierTotal;
      const itemTotalPrice = unitPrice * itemInput.quantity;
      subtotal += itemTotalPrice;

      processedItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        quantity: itemInput.quantity,
        unitPrice,
        totalPrice: itemTotalPrice,
        notes: itemInput.notes,
        modifiers: itemModifiers,
        rawItemInput: itemInput,
      });
    }

    const tax = Number((subtotal * store.taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    // 3. Find active cash shift
    const activeShift = mockDb.cashShifts.find(
      (s) => s.storeId === storeId && s.status === "OPEN"
    );

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 4. ATOMIC BOM INVENTORY DEDUCTION
    const bomIngredients = inventoryService.calculateOrderBOM(
      input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        modifiers: i.modifiers?.map((m) => ({
          groupName: m.groupName,
          optionName: m.optionName,
        })),
      }))
    );

    const stockDeductions: any[] = [];
    const lowStockAlerts: any[] = [];

    for (const req of bomIngredients) {
      const ingredient = mockDb.rawIngredients.find(
        (i) => i.id === req.ingredientId && i.storeId === storeId
      );
      if (ingredient) {
        ingredient.currentStock = Math.max(
          0,
          Number((ingredient.currentStock - req.quantity).toFixed(2))
        );
        ingredient.updatedAt = new Date();

        const stockTx = {
          id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          storeId,
          ingredientId: ingredient.id,
          type: "SOLD_ORDER" as const,
          quantityChange: -Number(req.quantity.toFixed(2)),
          remainingStock: ingredient.currentStock,
          referenceId: orderId,
          notes: `Sold in Ticket #${ticketNumber}`,
          createdById: input.cashierId || null,
          createdAt: new Date(),
        };
        mockDb.stockTransactions.push(stockTx);

        stockDeductions.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          deducted: req.quantity,
          remaining: ingredient.currentStock,
          unit: ingredient.unit,
        });

        if (ingredient.currentStock <= ingredient.reorderThreshold) {
          lowStockAlerts.push({
            ingredientId: ingredient.id,
            name: ingredient.name,
            currentStock: ingredient.currentStock,
            reorderThreshold: ingredient.reorderThreshold,
            unit: ingredient.unit,
          });
        }
      }
    }

    // 5. Create Order Record
    const orderRecord = {
      id: orderId,
      tenantId,
      storeId,
      shiftId: activeShift ? activeShift.id : null,
      cashierId: input.cashierId || "user-cashier-01",
      ticketNumber,
      invoiceNumber,
      channel: input.channel,
      status: "PENDING" as const,
      paymentStatus: "PAID" as const,
      subtotal,
      tax,
      discount: 0,
      total,
      currency: store.currency,
      khrRate: store.khrRate,
      tableNumber: input.tableNumber || null,
      customerName: input.customerName || null,
      notes: input.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: processedItems,
    };

    mockDb.orders.push(orderRecord);

    // 6. Record Payment Transaction
    const paymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: orderRecord.id,
      storeId,
      shiftId: activeShift ? activeShift.id : null,
      method: input.payment.method,
      amountUSD: input.payment.amountUSD,
      amountKHR: input.payment.amountKHR || Math.round(input.payment.amountUSD * store.khrRate),
      changeGivenUSD: input.payment.changeGivenUSD || 0,
      changeGivenKHR: input.payment.changeGivenKHR || 0,
      transactionRef: input.payment.transactionRef || `TX-${Date.now()}`,
      isConfirmed: true,
      createdAt: new Date(),
    };

    mockDb.paymentTransactions.push(paymentRecord);

    // 7. Update Shift Running Totals
    if (activeShift) {
      activeShift.orderCount += 1;
      if (input.payment.method === "CASH_USD" || input.payment.method === "CASH_KHR") {
        activeShift.totalCashSalesUSD += total;
        activeShift.totalCashSalesKHR += Math.round(total * store.khrRate);
      } else if (input.payment.method === "DYNAMIC_QR") {
        activeShift.totalQRSalesUSD += total;
      } else if (input.payment.method === "CREDIT_CARD") {
        activeShift.totalCardSalesUSD += total;
      }
      activeShift.updatedAt = new Date();
    }

    // 8. Real-time Notification to KDS & POS
    const socketGateway = getSocketGateway();
    if (socketGateway) {
      socketGateway.broadcastOrderCreated(storeId, {
        order: orderRecord,
        payment: paymentRecord,
        stockAlerts: lowStockAlerts,
      });
    }

    return {
      order: orderRecord,
      payment: paymentRecord,
      stockDeductions,
      lowStockAlerts,
    };
  }

  async getOrders(storeId: string, status?: string) {
    let orders = mockDb.orders.filter((o) => o.storeId === storeId);
    if (status && status !== "ALL") {
      orders = orders.filter((o) => o.status === status);
    }
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOrderById(orderId: string) {
    const order = mockDb.orders.find((o) => o.id === orderId);
    if (!order) return null;
    const payments = mockDb.paymentTransactions.filter((p) => p.orderId === order.id);
    return { ...order, payments };
  }

  async updateOrderStatus(orderId: string, nextStatus: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED") {
    const order = mockDb.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    order.status = nextStatus;
    order.updatedAt = new Date();

    if (nextStatus === "PREPARING" && !order.preparingAt) {
      order.preparingAt = new Date();
    } else if (nextStatus === "READY" && !order.readyAt) {
      order.readyAt = new Date();
    } else if (nextStatus === "COMPLETED" && !order.completedAt) {
      order.completedAt = new Date();
    } else if (nextStatus === "CANCELLED" && !order.cancelledAt) {
      order.cancelledAt = new Date();
    }

    const socketGateway = getSocketGateway();
    if (socketGateway) {
      socketGateway.broadcastOrderStatusUpdate(order.storeId, {
        orderId: order.id,
        ticketNumber: order.ticketNumber,
        status: nextStatus,
        updatedAt: order.updatedAt,
      });
    }

    return order;
  }
}

export const ordersService = new OrdersService();
