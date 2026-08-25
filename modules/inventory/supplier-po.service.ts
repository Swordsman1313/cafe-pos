import { db } from "@/lib/db";

export interface GeneratePODraftInput {
  storeId: string;
  daysForecast?: number; // default 7 days
}

export class SupplierPOService {
  /**
   * Generates automated supplier purchase order drafts based on 7-day sales velocity and low-stock deficits
   */
  public static async generateDraftPO(input: GeneratePODraftInput) {
    const storeId = input.storeId || "store-bkk1";
    const store = db.stores.find((s) => s.id === storeId) || db.stores[0];
    const ingredients = db.rawIngredients.filter((i) => i.storeId === storeId);

    // Group items needing reorder by Supplier Name
    const supplierGroups: Record<string, any[]> = {};

    for (const ing of ingredients) {
      const soldTxs = db.stockTransactions.filter(
        (t) => t.ingredientId === ing.id && t.type === "SOLD_ORDER"
      );
      const totalSold = Math.abs(soldTxs.reduce((sum, t) => sum + t.quantityChange, 0));
      const dailyVelocity = totalSold > 0 ? totalSold / 7 : ing.reorderThreshold / 10;
      const forecast7Days = dailyVelocity * (input.daysForecast || 7);

      // Reorder if current stock <= threshold or projected to run out in 7 days
      if (ing.currentStock <= ing.reorderThreshold || ing.currentStock < forecast7Days) {
        const supplier = ing.supplierName || "Standard General Roastery Supplier";
        const suggestedQty = Math.ceil(ing.reorderThreshold * 2.5 - ing.currentStock + forecast7Days);
        const estCost = Number((suggestedQty * ing.costPerUnit).toFixed(2));

        if (!supplierGroups[supplier]) {
          supplierGroups[supplier] = [];
        }

        supplierGroups[supplier].push({
          ingredientId: ing.id,
          name: ing.name,
          sku: ing.sku,
          unit: ing.unit,
          currentStock: ing.currentStock,
          reorderThreshold: ing.reorderThreshold,
          suggestedQty,
          unitCost: ing.costPerUnit,
          estimatedTotalCost: estCost,
        });
      }
    }

    // Create Draft Purchase Orders
    const generatedPOs: any[] = [];
    let poSeq = db.purchaseOrders.length + 1;

    for (const [supplierName, items] of Object.entries(supplierGroups)) {
      const totalCost = Number(items.reduce((sum, i) => sum + i.estimatedTotalCost, 0).toFixed(2));
      const poRecord = {
        id: `po-${Date.now()}-${poSeq}`,
        storeId,
        poNumber: `PO-2026-${String(poSeq).padStart(4, "0")}`,
        supplierName,
        status: "DRAFT",
        totalCost,
        items,
        notes: `Automated ${input.daysForecast || 7}-day velocity stock replenishment for ${store.name}`,
        createdAt: new Date(),
      };

      db.purchaseOrders.push(poRecord);
      generatedPOs.push(poRecord);
      poSeq++;
    }

    return {
      store: { id: store.id, name: store.name },
      generatedCount: generatedPOs.length,
      purchaseOrders: generatedPOs,
    };
  }

  public static async getPurchaseOrders(storeId?: string) {
    const list = storeId ? db.purchaseOrders.filter((p) => p.storeId === storeId) : db.purchaseOrders;
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
