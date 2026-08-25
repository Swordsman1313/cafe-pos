import { db } from "@/lib/db";

export interface SyncStoreMenuPayload {
  tenantId: string;
  sourceStoreId?: string;
  targetStoreIds: string[]; // ['store-bkk1', 'store-ttp', 'store-airport']
  overridePriceTier?: Record<string, number>; // storeId -> multiplier (e.g. 'store-airport' -> 1.15)
}

export class StoreSyncService {
  /**
   * 1-Click Master Menu Sync across all branch locations with price tier calculation (#4)
   */
  public static async syncCatalogAcrossStores(payload: SyncStoreMenuPayload) {
    const { tenantId, targetStoreIds, overridePriceTier } = payload;

    const masterProducts = db.products.filter((p) => p.tenantId === tenantId && p.isActive);
    const masterCategories = db.categories.filter((c) => c.tenantId === tenantId && c.isActive);

    const syncReport: Array<{ storeId: string; storeName: string; syncedProducts: number; priceMultiplier: number }> = [];

    for (const storeId of targetStoreIds) {
      const store = db.stores.find((s) => s.id === storeId);
      if (!store) continue;

      // Update store price multiplier if specified in payload
      if (overridePriceTier && overridePriceTier[storeId] !== undefined) {
        store.priceMultiplier = overridePriceTier[storeId];
        store.updatedAt = new Date();
      }

      // Ensure all master ingredients exist for target store
      for (const prod of masterProducts) {
        const baseRecipes = db.productRecipes.filter((r) => r.productId === prod.id);
        for (const recipe of baseRecipes) {
          const masterIng = db.rawIngredients.find((i) => i.id === recipe.ingredientId);
          if (masterIng) {
            const existingInStore = db.rawIngredients.find(
              (i) => i.storeId === storeId && i.sku === masterIng.sku
            );
            if (!existingInStore) {
              db.rawIngredients.push({
                id: `ing-${storeId}-${masterIng.sku.toLowerCase()}`,
                tenantId,
                storeId,
                name: masterIng.name,
                sku: masterIng.sku,
                unit: masterIng.unit,
                currentStock: 1000,
                reorderThreshold: masterIng.reorderThreshold,
                costPerUnit: masterIng.costPerUnit,
                supplierName: masterIng.supplierName,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
      }

      syncReport.push({
        storeId: store.id,
        storeName: store.name,
        syncedProducts: masterProducts.length,
        priceMultiplier: store.priceMultiplier,
      });
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      masterCategoriesCount: masterCategories.length,
      masterProductsCount: masterProducts.length,
      syncedStores: syncReport,
    };
  }

  public static async getStoreBranches(tenantId = "tenant-001") {
    return db.stores.filter((s) => s.tenantId === tenantId).map((s) => {
      const activeShift = db.cashShifts.find((sh) => sh.storeId === s.id && sh.status === "OPEN");
      const orderCount = db.orders.filter((o) => o.storeId === s.id).length;
      return {
        ...s,
        hasActiveShift: !!activeShift,
        activeShiftCashier: activeShift ? db.users.find((u) => u.id === activeShift.cashierId)?.name : null,
        orderCount,
      };
    });
  }

  public static async updateStoreMultiplier(storeId: string, multiplier: number) {
    const store = db.stores.find((s) => s.id === storeId);
    if (!store) throw new Error("Store branch not found");
    store.priceMultiplier = multiplier;
    store.updatedAt = new Date();
    return store;
  }
}
