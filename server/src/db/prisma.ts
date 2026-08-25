import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";

// Global Prisma instance for production PostgreSQL
export const prisma = new PrismaClient({
  log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

// Resilient in-memory database fallback for rapid testing, development, and offline mode
export class MockDatabaseStore {
  tenants: any[] = [];
  stores: any[] = [];
  users: any[] = [];
  userStoreRoles: any[] = [];
  categories: any[] = [];
  products: any[] = [];
  modifierGroups: any[] = [];
  modifierOptions: any[] = [];
  rawIngredients: any[] = [];
  productRecipes: any[] = [];
  modifierRecipes: any[] = [];
  stockTransactions: any[] = [];
  orders: any[] = [];
  orderItems: any[] = [];
  orderItemModifiers: any[] = [];
  paymentTransactions: any[] = [];
  cashShifts: any[] = [];
  cashMovements: any[] = [];

  private static instance: MockDatabaseStore;

  public static getInstance(): MockDatabaseStore {
    if (!MockDatabaseStore.instance) {
      MockDatabaseStore.instance = new MockDatabaseStore();
      MockDatabaseStore.instance.seedInitialData();
    }
    return MockDatabaseStore.instance;
  }

  public seedInitialData() {
    const tenantId = "tenant-001";
    const storeId = "store-001";
    const ownerId = "user-owner-01";
    const cashierId = "user-cashier-01";

    this.tenants = [
      {
        id: tenantId,
        name: "Artisan Roast Café",
        slug: "artisan-roast",
        plan: "ENTERPRISE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.stores = [
      {
        id: storeId,
        tenantId,
        name: "Artisan Roast - Flagship BKK1",
        code: "BKK1-STORE",
        address: "Street 302, BKK1, Phnom Penh",
        phone: "+855 23 888 999",
        currency: "USD",
        khrRate: 4000.0,
        taxRate: 0.10,
        receiptHeader: "☕ Artisan Roast Café - Speciality Coffee",
        receiptFooter: "Thank you! Wi-Fi: ArtisanGuest | Pass: Coffee2026",
        currentTicketSeq: 1153,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const defaultPinHash = bcrypt.hashSync("1234", 10);

    this.users = [
      {
        id: ownerId,
        tenantId,
        name: "Sovann (Owner)",
        email: "owner@artisanroast.com",
        pinHash: defaultPinHash,
        isActive: true,
      },
      {
        id: cashierId,
        tenantId,
        name: "Dara (Barista / Cashier)",
        email: "cashier@artisanroast.com",
        pinHash: defaultPinHash,
        isActive: true,
      },
    ];

    this.userStoreRoles = [
      { id: "usr-1", userId: ownerId, storeId, role: "OWNER" },
      { id: "usr-2", userId: cashierId, storeId, role: "CASHIER" },
    ];

    this.categories = [
      { id: "cat-esp", tenantId, name: "Espresso", slug: "espresso", icon: "Coffee", sortOrder: 1, isActive: true },
      { id: "cat-tea", tenantId, name: "Tea", slug: "tea", icon: "Leaf", sortOrder: 2, isActive: true },
      { id: "cat-fra", tenantId, name: "Frappe", slug: "frappe", icon: "Snowflake", sortOrder: 3, isActive: true },
      { id: "cat-pas", tenantId, name: "Pastries", slug: "pastries", icon: "Cookie", sortOrder: 4, isActive: true },
    ];

    // Raw Ingredients
    this.rawIngredients = [
      { id: "ing-beans", tenantId, storeId, name: "Espresso Coffee Beans (Arabica)", sku: "ING-BEAN", unit: "GRAM", currentStock: 5000, reorderThreshold: 1000, costPerUnit: 0.022 }, // 5kg ($22/kg)
      { id: "ing-milk-whole", tenantId, storeId, name: "Whole Fresh Milk", sku: "ING-MILK-W", unit: "ML", currentStock: 12000, reorderThreshold: 2000, costPerUnit: 0.0025 }, // 12L ($2.50/L)
      { id: "ing-milk-oat", tenantId, storeId, name: "Oat Milk (Barista Edition)", sku: "ING-MILK-OAT", unit: "ML", currentStock: 6000, reorderThreshold: 1500, costPerUnit: 0.0045 }, // 6L ($4.50/L)
      { id: "ing-sugar-syrup", tenantId, storeId, name: "Cane Sugar Syrup", sku: "ING-SYRUP", unit: "ML", currentStock: 4000, reorderThreshold: 800, costPerUnit: 0.003 },
      { id: "ing-matcha", tenantId, storeId, name: "Uji Matcha Powder", sku: "ING-MATCHA", unit: "GRAM", currentStock: 1500, reorderThreshold: 300, costPerUnit: 0.06 },
      { id: "ing-tea-jasmine", tenantId, storeId, name: "Jasmine Green Tea Leaves", sku: "ING-TEA-JAS", unit: "GRAM", currentStock: 2000, reorderThreshold: 400, costPerUnit: 0.03 },
      { id: "ing-ice", tenantId, storeId, name: "Purified Ice Cubes", sku: "ING-ICE", unit: "GRAM", currentStock: 25000, reorderThreshold: 5000, costPerUnit: 0.0005 },
      { id: "ing-cup-reg", tenantId, storeId, name: "12oz Eco Paper Cup + Lid", sku: "ING-CUP-12OZ", unit: "UNIT", currentStock: 350, reorderThreshold: 80, costPerUnit: 0.12 },
      { id: "ing-cup-lrg", tenantId, storeId, name: "16oz Eco Paper Cup + Lid", sku: "ING-CUP-16OZ", unit: "UNIT", currentStock: 280, reorderThreshold: 60, costPerUnit: 0.15 },
      { id: "ing-pastry-croissant", tenantId, storeId, name: "Butter Croissant (Frozen Ready)", sku: "ING-PAS-CR", unit: "UNIT", currentStock: 45, reorderThreshold: 10, costPerUnit: 0.90 },
      { id: "ing-pastry-cookie", tenantId, storeId, name: "Chocolate Cookie (Pack)", sku: "ING-PAS-CK", unit: "UNIT", currentStock: 60, reorderThreshold: 15, costPerUnit: 0.65 },
    ];

    // Products
    this.products = [
      { id: "esp-1", tenantId, categoryId: "cat-esp", sku: "PROD-ESP", name: "Espresso", price: 2.0, costPrice: 0.40, customizable: true, isActive: true },
      { id: "esp-2", tenantId, categoryId: "cat-esp", sku: "PROD-AME", name: "Americano", price: 2.5, costPrice: 0.52, customizable: true, isActive: true },
      { id: "esp-3", tenantId, categoryId: "cat-esp", sku: "PROD-CAP", name: "Cappuccino", price: 3.0, costPrice: 0.95, customizable: true, isActive: true },
      { id: "esp-4", tenantId, categoryId: "cat-esp", sku: "PROD-LAT", name: "Cafe Latte", price: 3.0, costPrice: 1.02, customizable: true, isActive: true },
      { id: "esp-5", tenantId, categoryId: "cat-esp", sku: "PROD-ICELAT", name: "Iced Latte", price: 3.25, costPrice: 1.15, customizable: true, isActive: true },
      { id: "esp-6", tenantId, categoryId: "cat-esp", sku: "PROD-MOC", name: "Mocha", price: 3.5, costPrice: 1.25, customizable: true, isActive: true },
      { id: "tea-1", tenantId, categoryId: "cat-tea", sku: "PROD-JASTEA", name: "Jasmine Tea", price: 2.0, costPrice: 0.45, customizable: true, isActive: true },
      { id: "tea-2", tenantId, categoryId: "cat-tea", sku: "PROD-MILKTEA", name: "Milk Tea", price: 2.5, costPrice: 0.80, customizable: true, isActive: true },
      { id: "tea-3", tenantId, categoryId: "cat-tea", sku: "PROD-LEMTEA", name: "Iced Lemon Tea", price: 2.25, costPrice: 0.55, customizable: true, isActive: true },
      { id: "fra-3", tenantId, categoryId: "cat-fra", sku: "PROD-MATFRA", name: "Matcha Frappe", price: 4.0, costPrice: 1.45, customizable: true, isActive: true },
      { id: "pas-1", tenantId, categoryId: "cat-pas", sku: "PROD-CROISSANT", name: "Butter Croissant", price: 2.25, costPrice: 0.90, customizable: false, isActive: true },
      { id: "pas-2", tenantId, categoryId: "cat-pas", sku: "PROD-COOKIE", name: "Chocolate Cookie", price: 1.75, costPrice: 0.65, customizable: false, isActive: true },
    ];

    // Modifier Groups & Options for Customizable Drinks
    for (const prod of this.products.filter((p) => p.customizable)) {
      const sizeGroupId = `mg-size-${prod.id}`;
      const sweetGroupId = `mg-sweet-${prod.id}`;
      const iceGroupId = `mg-ice-${prod.id}`;
      const milkGroupId = `mg-milk-${prod.id}`;

      this.modifierGroups.push(
        { id: sizeGroupId, productId: prod.id, name: "Size", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 1 },
        { id: sweetGroupId, productId: prod.id, name: "Sweetness", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 2 },
        { id: iceGroupId, productId: prod.id, name: "Ice Level", minSelect: 1, maxSelect: 1, isRequired: true, sortOrder: 3 },
        { id: milkGroupId, productId: prod.id, name: "Milk Option", minSelect: 0, maxSelect: 1, isRequired: false, sortOrder: 4 }
      );

      this.modifierOptions.push(
        { id: `opt-sz-reg-${prod.id}`, modifierGroupId: sizeGroupId, name: "Regular", priceDelta: 0.0, isDefault: true },
        { id: `opt-sz-lrg-${prod.id}`, modifierGroupId: sizeGroupId, name: "Large", priceDelta: 0.50, isDefault: false },
        { id: `opt-sw-100-${prod.id}`, modifierGroupId: sweetGroupId, name: "100%", priceDelta: 0.0, isDefault: true },
        { id: `opt-sw-75-${prod.id}`, modifierGroupId: sweetGroupId, name: "75%", priceDelta: 0.0, isDefault: false },
        { id: `opt-sw-50-${prod.id}`, modifierGroupId: sweetGroupId, name: "50%", priceDelta: 0.0, isDefault: false },
        { id: `opt-sw-25-${prod.id}`, modifierGroupId: sweetGroupId, name: "25%", priceDelta: 0.0, isDefault: false },
        { id: `opt-sw-0-${prod.id}`, modifierGroupId: sweetGroupId, name: "0%", priceDelta: 0.0, isDefault: false },
        { id: `opt-ic-norm-${prod.id}`, modifierGroupId: iceGroupId, name: "Normal", priceDelta: 0.0, isDefault: true },
        { id: `opt-ic-less-${prod.id}`, modifierGroupId: iceGroupId, name: "Less Ice", priceDelta: 0.0, isDefault: false },
        { id: `opt-ic-no-${prod.id}`, modifierGroupId: iceGroupId, name: "No Ice", priceDelta: 0.0, isDefault: false },
        { id: `opt-mlk-oat-${prod.id}`, modifierGroupId: milkGroupId, name: "Oat Milk", priceDelta: 0.60, isDefault: false }
      );
    }

    // Recipes (BOM) linking Products & Modifiers to Raw Ingredients
    this.productRecipes = [
      // Espresso: 18g beans
      { id: "pr-1", productId: "esp-1", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      // Americano: 18g beans + 12oz cup
      { id: "pr-2", productId: "esp-2", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-3", productId: "esp-2", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      // Cafe Latte: 18g beans + 200ml whole milk + 12oz cup
      { id: "pr-4", productId: "esp-4", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-5", productId: "esp-4", ingredientId: "ing-milk-whole", quantity: 200, unit: "ML" },
      { id: "pr-6", productId: "esp-4", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      // Iced Latte: 18g beans + 180ml whole milk + 120g ice + 12oz cup
      { id: "pr-7", productId: "esp-5", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-8", productId: "esp-5", ingredientId: "ing-milk-whole", quantity: 180, unit: "ML" },
      { id: "pr-9", productId: "esp-5", ingredientId: "ing-ice", quantity: 120, unit: "GRAM" },
      { id: "pr-10", productId: "esp-5", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      // Matcha Frappe: 15g matcha + 150ml milk + 25ml syrup + 180g ice + 16oz cup
      { id: "pr-11", productId: "fra-3", ingredientId: "ing-matcha", quantity: 15, unit: "GRAM" },
      { id: "pr-12", productId: "fra-3", ingredientId: "ing-milk-whole", quantity: 150, unit: "ML" },
      { id: "pr-13", productId: "fra-3", ingredientId: "ing-sugar-syrup", quantity: 25, unit: "ML" },
      { id: "pr-14", productId: "fra-3", ingredientId: "ing-ice", quantity: 180, unit: "GRAM" },
      { id: "pr-15", productId: "fra-3", ingredientId: "ing-cup-lrg", quantity: 1, unit: "UNIT" },
      // Pastries: 1 unit each
      { id: "pr-16", productId: "pas-1", ingredientId: "ing-pastry-croissant", quantity: 1, unit: "UNIT" },
      { id: "pr-17", productId: "pas-2", ingredientId: "ing-pastry-cookie", quantity: 1, unit: "UNIT" },
    ];

    // Modifier Recipes (e.g. Oat milk substitutes whole milk; Large size swaps 12oz cup for 16oz cup and adds 60ml milk)
    // When size is Large: adds 60ml milk or extra ice
    // We handle modifier deltas dynamically in the BOM Engine
  }
}

export const mockDb = MockDatabaseStore.getInstance();
