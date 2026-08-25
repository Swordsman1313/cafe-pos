import { mockDb } from "../../db/prisma.js";

export class CatalogService {
  async getCategories(tenantId: string) {
    return mockDb.categories
      .filter((c) => c.tenantId === tenantId && c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getProducts(tenantId: string, categoryId?: string) {
    let prods = mockDb.products.filter((p) => p.tenantId === tenantId && p.isActive);
    if (categoryId && categoryId !== "all") {
      prods = prods.filter((p) => p.categoryId === categoryId);
    }

    return prods.map((product) => {
      const modifierGroups = mockDb.modifierGroups
        .filter((g) => g.productId === product.id)
        .map((group) => ({
          ...group,
          options: mockDb.modifierOptions
            .filter((o) => o.modifierGroupId === group.id)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      const recipes = mockDb.productRecipes
        .filter((r) => r.productId === product.id)
        .map((r) => {
          const ing = mockDb.rawIngredients.find((i) => i.id === r.ingredientId);
          return {
            ...r,
            ingredientName: ing ? ing.name : "Unknown",
            unit: r.unit,
          };
        });

      return {
        ...product,
        modifierGroups,
        recipes,
      };
    });
  }

  async getProductById(productId: string) {
    const product = mockDb.products.find((p) => p.id === productId);
    if (!product) return null;

    const modifierGroups = mockDb.modifierGroups
      .filter((g) => g.productId === product.id)
      .map((group) => ({
        ...group,
        options: mockDb.modifierOptions.filter((o) => o.modifierGroupId === group.id),
      }));

    return {
      ...product,
      modifierGroups,
    };
  }
}

export const catalogService = new CatalogService();
