// Offline persistence and resilience manager for Cafe POS

export interface OfflineQueuedOrder {
  id: string;
  ticketNumber: string;
  timestamp: string;
  items: Array<{ name: string; qty: number; total: number; modifiers?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  channel: string;
  synced: boolean;
}

const STORAGE_KEYS = {
  CART: "cafe_pos_active_cart",
  ACTIVE_ID: "cafe_pos_active_cart_id",
  HELD: "cafe_pos_held_orders",
  QUEUE: "cafe_pos_offline_orders_queue",
  HISTORY: "cafe_pos_completed_orders",
  CHANNEL: "cafe_pos_order_channel",
};

export const offlineStorage = {
  saveCart(cart: unknown) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      }
    } catch {}
  },
  loadCart<T>(): T | null {
    try {
      if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEYS.CART);
        return data ? JSON.parse(data) : null;
      }
    } catch {}
    return null;
  },

  saveHeldOrders(orders: unknown) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HELD, JSON.stringify(orders));
      }
    } catch {}
  },
  loadHeldOrders<T>(): T | null {
    try {
      if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEYS.HELD);
        return data ? JSON.parse(data) : null;
      }
    } catch {}
    return null;
  },

  queueOfflineOrder(order: OfflineQueuedOrder) {
    try {
      if (typeof window !== "undefined") {
        const existing = this.getOfflineQueue();
        existing.push(order);
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(existing));
      }
    } catch {}
  },

  getOfflineQueue(): OfflineQueuedOrder[] {
    try {
      if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEYS.QUEUE);
        return data ? JSON.parse(data) : [];
      }
    } catch {}
    return [];
  },

  clearOfflineQueue() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify([]));
      }
    } catch {}
  },

  saveCompletedOrders(orders: unknown) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(orders));
      }
    } catch {}
  },

  loadCompletedOrders<T>(): T | null {
    try {
      if (typeof window !== "undefined") {
        const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
        return data ? JSON.parse(data) : null;
      }
    } catch {}
    return null;
  },
};
