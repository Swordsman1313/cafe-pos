import { db } from "@/lib/db";
import { TelegramService } from "../telegram/telegram.service";

export interface StockAdjustPayload {
  storeId: string;
  ingredientId: string;
  type: "RESTOCK" | "WASTE_SPILLAGE" | "AUDIT_ADJUSTMENT";
  quantity: number;
  notes?: string;
  staffId?: string;
  supervisorName?: string;
}

export class InventoryService {
  public static async getIngredients(storeId = "store-bkk1") {
    const ingredients = db.rawIngredients.filter((i) => i.storeId === storeId);
    return ingredients.map((ing) => {
      const isLowStock = ing.currentStock <= ing.reorderThreshold;
      const healthPercentage = Math.min(
        100,
        Math.round((ing.currentStock / (ing.reorderThreshold * 2)) * 100)
      );

      return {
        ...ing,
        isLowStock,
        healthPercentage,
      };
    });
  }

  public static async getLowStockAlerts(storeId = "store-bkk1") {
    return db.rawIngredients
      .filter((i) => i.storeId === storeId && i.currentStock <= i.reorderThreshold)
      .map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        unit: i.unit,
        currentStock: i.currentStock,
        reorderThreshold: i.reorderThreshold,
        supplierName: i.supplierName,
        deficit: i.reorderThreshold - i.currentStock,
      }));
  }

  public static async adjustStock(payload: StockAdjustPayload) {
    const ingredient = db.rawIngredients.find((i) => i.id === payload.ingredientId);
    if (!ingredient) throw new Error("Ingredient not found");

    let delta = 0;
    if (payload.type === "RESTOCK") delta = Math.abs(payload.quantity);
    else if (payload.type === "WASTE_SPILLAGE") delta = -Math.abs(payload.quantity);
    else if (payload.type === "AUDIT_ADJUSTMENT") delta = payload.quantity;

    ingredient.currentStock = Math.max(0, Number((ingredient.currentStock + delta).toFixed(2)));
    ingredient.updatedAt = new Date();

    const tx = {
      id: `st-${Date.now()}`,
      storeId: payload.storeId,
      ingredientId: ingredient.id,
      type: payload.type,
      quantityChange: Number(delta.toFixed(2)),
      remainingStock: ingredient.currentStock,
      referenceId: null,
      notes: payload.notes || `Manual ${payload.type}`,
      createdById: payload.staffId || null,
      createdAt: new Date(),
    };

    db.stockTransactions.push(tx);

    // If spillage or audit, notify owner via Telegram (#5)
    if (payload.type === "WASTE_SPILLAGE") {
      const store = db.stores.find((s) => s.id === payload.storeId);
      TelegramService.sendAuditAlert("tenant-001", {
        type: "WASTE_SPILLAGE",
        ingredientName: ingredient.name,
        quantity: Math.abs(payload.quantity),
        unit: ingredient.unit,
        supervisorName: payload.supervisorName || "Supervisor",
        storeName: store?.name || "Store",
        reason: payload.notes || "Recorded spillage",
      }).catch(console.error);
    }

    return {
      ingredient,
      transaction: tx,
      isLowStock: ingredient.currentStock <= ingredient.reorderThreshold,
    };
  }
}
