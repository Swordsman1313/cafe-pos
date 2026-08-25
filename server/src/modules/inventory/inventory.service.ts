import { mockDb } from "../../db/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";

export interface StockAdjustmentInput {
  ingredientId: string;
  type: "RESTOCK" | "WASTE_SPILLAGE" | "AUDIT_ADJUSTMENT";
  quantity: number; // positive for restock, positive amount wasted/adjusted
  notes?: string;
  staffId?: string;
}

export class InventoryService {
  async getIngredients(storeId: string) {
    const ingredients = mockDb.rawIngredients.filter((i) => i.storeId === storeId);
    return ingredients.map((ing) => {
      const isLowStock = ing.currentStock <= ing.reorderThreshold;
      const stockHealthPercentage = Math.min(
        100,
        Math.round((ing.currentStock / (ing.reorderThreshold * 2)) * 100)
      );
      return {
        ...ing,
        isLowStock,
        stockHealthPercentage,
      };
    });
  }

  async getLowStockAlerts(storeId: string) {
    return mockDb.rawIngredients
      .filter((i) => i.storeId === storeId && i.currentStock <= i.reorderThreshold)
      .map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        unit: i.unit,
        currentStock: i.currentStock,
        reorderThreshold: i.reorderThreshold,
        deficit: i.reorderThreshold - i.currentStock,
      }));
  }

  async getStockTransactions(storeId: string, limit = 50) {
    return mockDb.stockTransactions
      .filter((t) => t.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((t) => {
        const ing = mockDb.rawIngredients.find((i) => i.id === t.ingredientId);
        const staff = mockDb.users.find((u) => u.id === t.createdById);
        return {
          ...t,
          ingredientName: ing ? ing.name : "Unknown",
          ingredientUnit: ing ? ing.unit : "",
          staffName: staff ? staff.name : "System",
        };
      });
  }

  async adjustStock(storeId: string, input: StockAdjustmentInput) {
    const ingredient = mockDb.rawIngredients.find(
      (i) => i.id === input.ingredientId && i.storeId === storeId
    );
    if (!ingredient) {
      throw new AppError("Raw ingredient not found", 404);
    }

    let delta = 0;
    if (input.type === "RESTOCK") {
      delta = Math.abs(input.quantity);
    } else if (input.type === "WASTE_SPILLAGE") {
      delta = -Math.abs(input.quantity);
    } else if (input.type === "AUDIT_ADJUSTMENT") {
      delta = input.quantity; // direct delta
    }

    const previousStock = ingredient.currentStock;
    const newStock = Math.max(0, previousStock + delta);
    ingredient.currentStock = Number(newStock.toFixed(2));
    ingredient.updatedAt = new Date();

    const transaction = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeId,
      ingredientId: ingredient.id,
      type: input.type,
      quantityChange: Number(delta.toFixed(2)),
      remainingStock: ingredient.currentStock,
      referenceId: null,
      notes: input.notes || `Manual ${input.type} adjustment`,
      createdById: input.staffId || null,
      createdAt: new Date(),
    };

    mockDb.stockTransactions.push(transaction);

    return {
      ingredient,
      transaction,
      isLowStock: ingredient.currentStock <= ingredient.reorderThreshold,
    };
  }

  /**
   * Calculates required raw ingredients for a list of cart items based on Product Recipes & Modifiers.
   */
  calculateOrderBOM(items: Array<{ productId: string; quantity: number; modifiers?: Array<{ groupName: string; optionName: string }> }>) {
    const ingredientRequirements = new Map<string, { ingredientId: string; quantity: number; unit: string; name: string }>();

    for (const item of items) {
      const baseRecipes = mockDb.productRecipes.filter((r) => r.productId === item.productId);
      const isLarge = item.modifiers?.some((m) => m.groupName.toLowerCase() === "size" && m.optionName.toLowerCase() === "large");
      const isOatMilk = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("milk") && m.optionName.toLowerCase().includes("oat"));
      const isZeroSugar = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("sweet") && m.optionName.includes("0%"));
      const isNoIce = item.modifiers?.some((m) => m.groupName.toLowerCase().includes("ice") && m.optionName.toLowerCase().includes("no ice"));

      for (const recipe of baseRecipes) {
        const ing = mockDb.rawIngredients.find((i) => i.id === recipe.ingredientId);
        if (!ing) continue;

        let qtyPerServing = recipe.quantity;

        // Modifier overrides & substitutions:
        if (isLarge) {
          if (ing.id === "ing-cup-reg") {
            // Swap regular cup to large cup
            continue;
          }
          if (ing.id === "ing-milk-whole" || ing.id === "ing-ice" || ing.id === "ing-sugar-syrup") {
            qtyPerServing *= 1.35; // 35% more liquid/ice
          }
        }

        if (isOatMilk && ing.id === "ing-milk-whole") {
          // Substitute whole milk with oat milk
          continue;
        }

        if (isZeroSugar && ing.id === "ing-sugar-syrup") {
          continue;
        }

        if (isNoIce && ing.id === "ing-ice") {
          continue;
        }

        const totalQty = qtyPerServing * item.quantity;
        const existing = ingredientRequirements.get(ing.id) || {
          ingredientId: ing.id,
          quantity: 0,
          unit: ing.unit,
          name: ing.name,
        };
        existing.quantity += totalQty;
        ingredientRequirements.set(ing.id, existing);
      }

      // Add substitutions
      if (isLarge) {
        const largeCup = mockDb.rawIngredients.find((i) => i.id === "ing-cup-lrg");
        if (largeCup) {
          const existing = ingredientRequirements.get(largeCup.id) || {
            ingredientId: largeCup.id,
            quantity: 0,
            unit: largeCup.unit,
            name: largeCup.name,
          };
          existing.quantity += 1 * item.quantity;
          ingredientRequirements.set(largeCup.id, existing);
        }
      }

      if (isOatMilk) {
        const oatMilk = mockDb.rawIngredients.find((i) => i.id === "ing-milk-oat");
        if (oatMilk) {
          const qty = (isLarge ? 260 : 200) * item.quantity;
          const existing = ingredientRequirements.get(oatMilk.id) || {
            ingredientId: oatMilk.id,
            quantity: 0,
            unit: oatMilk.unit,
            name: oatMilk.name,
          };
          existing.quantity += qty;
          ingredientRequirements.set(oatMilk.id, existing);
        }
      }
    }

    return Array.from(ingredientRequirements.values());
  }
}

export const inventoryService = new InventoryService();
