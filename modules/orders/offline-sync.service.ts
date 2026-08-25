import { OrdersService, CheckoutInput } from "./orders.service";

export interface SyncBatchPayload {
  storeId: string;
  cashierId: string;
  offlineOrders: Array<{
    offlineId: string;
    clientTimestamp: string;
    payload: CheckoutInput;
  }>;
}

export class OfflineSyncService {
  /**
   * Reconciles a batch of offline orders queued in browser IndexedDB
   */
  public static async syncBatch(payload: SyncBatchPayload) {
    const results: any[] = [];
    const errors: any[] = [];

    for (const offline of payload.offlineOrders) {
      try {
        const result = await OrdersService.executeCheckout({
          ...offline.payload,
          storeId: payload.storeId,
          cashierId: payload.cashierId,
        });

        results.push({
          offlineId: offline.offlineId,
          serverOrderId: result.order.id,
          ticketNumber: result.order.ticketNumber,
          syncedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        errors.push({
          offlineId: offline.offlineId,
          error: err.message || "Failed to process offline order",
        });
      }
    }

    return {
      success: true,
      syncedCount: results.length,
      failedCount: errors.length,
      syncedOrders: results,
      errors,
    };
  }
}
