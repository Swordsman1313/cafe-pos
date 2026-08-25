import { db } from "@/lib/db";

export interface CreateProductInput {
  tenantId: string;
  categoryId: string;
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  customizable?: boolean;
  station?: "BARISTA" | "KITCHEN" | "BOTH";
  recipes?: Array<{ ingredientId: string; quantity: number; unit: string }>;
}

export class CatalogService {
  public static async getCategories(tenantId = "tenant-001") {
    return db.categories
      .filter((c) => c.tenantId === tenantId && c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async getProducts(tenantId = "tenant-001", storeId?: string, categoryId?: string) {
    const store = storeId ? db.stores.find((s) => s.id === storeId) : db.stores[0];
    const multiplier = store?.priceMultiplier || 1.0;

    let prods = db.products.filter((p) => p.tenantId === tenantId && p.isActive);
    if (categoryId && categoryId !== "all") {
      prods = prods.filter((p) => p.categoryId === categoryId);
    }

    return prods.map((product) => {
      const modifierGroups = db.modifierGroups
        .filter((g) => g.productId === product.id)
        .map((group) => ({
          ...group,
          options: db.modifierOptions
            .filter((o) => o.modifierGroupId === group.id)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      const recipes = db.productRecipes
        .filter((r) => r.productId === product.id)
        .map((r) => {
          const ing = db.rawIngredients.find((i) => i.id === r.ingredientId);
          return {
            ...r,
            ingredientName: ing ? ing.name : "Unknown Ingredient",
            costPerServing: ing ? Number((ing.costPerUnit * r.quantity).toFixed(3)) : 0,
          };
        });

      const calculatedCOGS = recipes.reduce((sum, r) => sum + r.costPerServing, 0);
      const effectivePrice = Number((product.price * multiplier).toFixed(2));
      const grossMarginUSD = Number((effectivePrice - (calculatedCOGS || product.costPrice)).toFixed(2));
      const grossMarginPercent = effectivePrice > 0 ? Number(((grossMarginUSD / effectivePrice) * 100).toFixed(1)) : 0;

      return {
        ...product,
        basePrice: product.price,
        effectivePrice,
        costPrice: calculatedCOGS > 0 ? calculatedCOGS : product.costPrice,
        grossMarginUSD,
        grossMarginPercent,
        modifierGroups,
        recipes,
      };
    });
  }

  public static async saveProduct(input: CreateProductInput) {
    const productId = `prod-${Date.now()}`;
    const product = {
      id: productId,
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      sku: input.sku,
      name: input.name,
      price: input.price,
      costPrice: input.costPrice || 0.5,
      customizable: input.customizable ?? true,
      station: input.station || "BARISTA",
      isActive: true,
      sortOrder: db.products.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.products.push(product);

    if (input.recipes && input.recipes.length > 0) {
      for (const r of input.recipes) {
        db.productRecipes.push({
          id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId,
          ingredientId: r.ingredientId,
          quantity: r.quantity,
          unit: r.unit,
          createdAt: new Date(),
        });
      }
    }

    return product;
  }
}
