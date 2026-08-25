import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export class MockDataStore {
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
  purchaseOrders: any[] = [];
  orders: any[] = [];
  orderItems: any[] = [];
  orderItemModifiers: any[] = [];
  paymentTransactions: any[] = [];
  cashShifts: any[] = [];
  cashMovements: any[] = [];
  telegramConfigs: any[] = [];

  private static instance: MockDataStore;

  public static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore();
      MockDataStore.instance.seedInitialData();
    }
    return MockDataStore.instance;
  }

  public seedInitialData() {
    const tenantId = "tenant-001";
    const store1Id = "store-bkk1";
    const store2Id = "store-ttp";
    const store3Id = "store-airport";

    this.tenants = [
      {
        id: tenantId,
        name: "Artisan Roast Café Chain",
        slug: "artisan-roast",
        plan: "ENTERPRISE",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.stores = [
      {
        id: store1Id,
        tenantId,
        name: "Artisan Roast - Flagship BKK1",
        code: "BKK1-STORE",
        address: "Street 302, BKK1, Phnom Penh",
        phone: "+855 23 888 999",
        currency: "USD",
        khrRate: 4000.0,
        taxRate: 0.10,
        priceMultiplier: 1.0,
        receiptHeader: "☕ Artisan Roast Café - Speciality Coffee",
        receiptFooter: "Thank you! Wi-Fi: ArtisanGuest | Pass: Coffee2026",
        currentTicketSeq: 1153,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: store2Id,
        tenantId,
        name: "Artisan Roast - Toul Tom Poung (Russian Market)",
        code: "TTP-STORE",
        address: "Street 432, TTP, Phnom Penh",
        phone: "+855 23 777 666",
        currency: "USD",
        khrRate: 4000.0,
        taxRate: 0.10,
        priceMultiplier: 1.0,
        receiptHeader: "☕ Artisan Roast Café - TTP Branch",
        receiptFooter: "Thank you! Wi-Fi: ArtisanTTP | Pass: Coffee2026",
        currentTicketSeq: 1040,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: store3Id,
        tenantId,
        name: "Artisan Roast - Phnom Penh Int'l Airport Kiosk",
        code: "AIRPORT-KIOSK",
        address: "Departure Terminal 1, PNH Airport",
        phone: "+855 23 555 444",
        currency: "USD",
        khrRate: 4000.0,
        taxRate: 0.10,
        priceMultiplier: 1.15,
        receiptHeader: "☕ Artisan Roast Café - Airport Kiosk",
        receiptFooter: "Have a safe flight! Wi-Fi: AirportGuest",
        currentTicketSeq: 1089,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const cashierPinHash = bcrypt.hashSync("1234", 10);
    const baristaPinHash = bcrypt.hashSync("2222", 10);
    const supervisorPinHash = bcrypt.hashSync("3333", 10);
    const ownerPinHash = bcrypt.hashSync("9999", 10);
    const ownerPassHash = bcrypt.hashSync("admin123", 10);

    const cashierId = "usr-cashier-01";
    const baristaId = "usr-barista-01";
    const supervisorId = "usr-sup-01";
    const managerId = "usr-mgr-01";
    const ownerId = "usr-owner-01";

    this.users = [
      {
        id: cashierId,
        tenantId,
        name: "Dara (Front Cashier)",
        email: "cashier@artisanroast.com",
        pinHash: cashierPinHash,
        passwordHash: null,
        isActive: true,
      },
      {
        id: baristaId,
        tenantId,
        name: "Sophea (Lead Barista)",
        email: "barista@artisanroast.com",
        pinHash: baristaPinHash,
        passwordHash: null,
        isActive: true,
      },
      {
        id: supervisorId,
        tenantId,
        name: "Channary (Shift Supervisor)",
        email: "supervisor@artisanroast.com",
        pinHash: supervisorPinHash,
        passwordHash: ownerPassHash,
        isActive: true,
      },
      {
        id: managerId,
        tenantId,
        name: "Kosal (General Store Manager)",
        email: "manager@artisanroast.com",
        pinHash: ownerPinHash,
        passwordHash: ownerPassHash,
        isActive: true,
      },
      {
        id: ownerId,
        tenantId,
        name: "Sovann (Owner / Founder)",
        email: "owner@artisanroast.com",
        pinHash: ownerPinHash,
        passwordHash: ownerPassHash,
        isActive: true,
      },
    ];

    this.userStoreRoles = [
      { id: "usr-r4", userId: cashierId, storeId: store1Id, role: "CASHIER" },
      { id: "usr-r5", userId: baristaId, storeId: store1Id, role: "BARISTA" },
      { id: "usr-r3", userId: supervisorId, storeId: store1Id, role: "SUPERVISOR" },
      { id: "usr-r2", userId: managerId, storeId: store1Id, role: "STORE_MANAGER" },
      { id: "usr-r1", userId: ownerId, storeId: store1Id, role: "OWNER" },
    ];

    this.categories = [
      { id: "cat-esp", tenantId, name: "Espresso", slug: "espresso", icon: "Coffee", sortOrder: 1, isActive: true },
      { id: "cat-tea", tenantId, name: "Tea", slug: "tea", icon: "Leaf", sortOrder: 2, isActive: true },
      { id: "cat-fra", tenantId, name: "Frappe", slug: "frappe", icon: "Snowflake", sortOrder: 3, isActive: true },
      { id: "cat-pas", tenantId, name: "Pastries & Food", slug: "pastries", icon: "Cookie", sortOrder: 4, isActive: true },
    ];

    // Raw Ingredients per Store (Note: Croissant and Cookies have low stock to test PO automation)
    this.rawIngredients = [
      { id: "ing-beans", tenantId, storeId: store1Id, name: "Espresso Coffee Beans (Arabica)", sku: "ING-BEAN", unit: "GRAM", currentStock: 5000, reorderThreshold: 1000, costPerUnit: 0.022, supplierName: "Phnom Penh Roastery Co." },
      { id: "ing-milk-whole", tenantId, storeId: store1Id, name: "Whole Fresh Milk", sku: "ING-MILK-W", unit: "ML", currentStock: 12000, reorderThreshold: 2000, costPerUnit: 0.0025, supplierName: "Angkor Dairy Farm" },
      { id: "ing-milk-oat", tenantId, storeId: store1Id, name: "Oat Milk (Barista Edition)", sku: "ING-MILK-OAT", unit: "ML", currentStock: 6000, reorderThreshold: 1500, costPerUnit: 0.0045, supplierName: "Oatbedient Import" },
      { id: "ing-sugar-syrup", tenantId, storeId: store1Id, name: "Cane Sugar Syrup", sku: "ING-SYRUP", unit: "ML", currentStock: 4000, reorderThreshold: 800, costPerUnit: 0.003, supplierName: "Local Palm & Cane Co." },
      { id: "ing-matcha", tenantId, storeId: store1Id, name: "Uji Matcha Powder", sku: "ING-MATCHA", unit: "GRAM", currentStock: 1500, reorderThreshold: 300, costPerUnit: 0.06, supplierName: "Kyoto Direct Imports" },
      { id: "ing-tea-jasmine", tenantId, storeId: store1Id, name: "Jasmine Green Tea Leaves", sku: "ING-TEA-JAS", unit: "GRAM", currentStock: 2000, reorderThreshold: 400, costPerUnit: 0.03, supplierName: "Mondulkiri Tea Estate" },
      { id: "ing-ice", tenantId, storeId: store1Id, name: "Purified Ice Cubes", sku: "ING-ICE", unit: "GRAM", currentStock: 25000, reorderThreshold: 5000, costPerUnit: 0.0005, supplierName: "Crystal Ice Factory" },
      { id: "ing-cup-reg", tenantId, storeId: store1Id, name: "12oz Eco Paper Cup + Lid", sku: "ING-CUP-12OZ", unit: "UNIT", currentStock: 350, reorderThreshold: 80, costPerUnit: 0.12, supplierName: "EcoPack Cambodia" },
      { id: "ing-cup-lrg", tenantId, storeId: store1Id, name: "16oz Eco Paper Cup + Lid", sku: "ING-CUP-16OZ", unit: "UNIT", currentStock: 280, reorderThreshold: 60, costPerUnit: 0.15, supplierName: "EcoPack Cambodia" },
      { id: "ing-pastry-croissant", tenantId, storeId: store1Id, name: "Butter Croissant (Fresh)", sku: "ING-PAS-CR", unit: "UNIT", currentStock: 8, reorderThreshold: 15, costPerUnit: 0.90, supplierName: "Artisan French Bakery" },
      { id: "ing-pastry-cookie", tenantId, storeId: store1Id, name: "Chocolate Cookie (Pack)", sku: "ING-PAS-CK", unit: "UNIT", currentStock: 10, reorderThreshold: 20, costPerUnit: 0.65, supplierName: "Artisan French Bakery" },
    ];

    // Master Catalog Products
    this.products = [
      { id: "esp-1", tenantId, categoryId: "cat-esp", sku: "PROD-ESP", name: "Espresso", price: 2.0, costPrice: 0.40, customizable: true, station: "BARISTA", isActive: true },
      { id: "esp-2", tenantId, categoryId: "cat-esp", sku: "PROD-AME", name: "Americano", price: 2.5, costPrice: 0.52, customizable: true, station: "BARISTA", isActive: true },
      { id: "esp-3", tenantId, categoryId: "cat-esp", sku: "PROD-CAP", name: "Cappuccino", price: 3.0, costPrice: 0.95, customizable: true, station: "BARISTA", isActive: true },
      { id: "esp-4", tenantId, categoryId: "cat-esp", sku: "PROD-LAT", name: "Cafe Latte", price: 3.0, costPrice: 1.02, customizable: true, station: "BARISTA", isActive: true },
      { id: "esp-5", tenantId, categoryId: "cat-esp", sku: "PROD-ICELAT", name: "Iced Latte", price: 3.25, costPrice: 1.15, customizable: true, station: "BARISTA", isActive: true },
      { id: "esp-6", tenantId, categoryId: "cat-esp", sku: "PROD-MOC", name: "Mocha", price: 3.5, costPrice: 1.25, customizable: true, station: "BARISTA", isActive: true },
      { id: "tea-1", tenantId, categoryId: "cat-tea", sku: "PROD-JASTEA", name: "Jasmine Tea", price: 2.0, costPrice: 0.45, customizable: true, station: "BARISTA", isActive: true },
      { id: "tea-2", tenantId, categoryId: "cat-tea", sku: "PROD-MILKTEA", name: "Milk Tea", price: 2.5, costPrice: 0.80, customizable: true, station: "BARISTA", isActive: true },
      { id: "tea-3", tenantId, categoryId: "cat-tea", sku: "PROD-LEMTEA", name: "Iced Lemon Tea", price: 2.25, costPrice: 0.55, customizable: true, station: "BARISTA", isActive: true },
      { id: "fra-3", tenantId, categoryId: "cat-fra", sku: "PROD-MATFRA", name: "Matcha Frappe", price: 4.0, costPrice: 1.45, customizable: true, station: "BARISTA", isActive: true },
      { id: "pas-1", tenantId, categoryId: "cat-pas", sku: "PROD-CROISSANT", name: "Butter Croissant", price: 2.25, costPrice: 0.90, customizable: false, station: "KITCHEN", isActive: true },
      { id: "pas-2", tenantId, categoryId: "cat-pas", sku: "PROD-COOKIE", name: "Chocolate Cookie", price: 1.75, costPrice: 0.65, customizable: false, station: "KITCHEN", isActive: true },
    ];

    // Modifier Groups
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

    // Product Recipes (BOM)
    this.productRecipes = [
      { id: "pr-1", productId: "esp-1", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-2", productId: "esp-2", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-3", productId: "esp-2", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      { id: "pr-4", productId: "esp-4", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-5", productId: "esp-4", ingredientId: "ing-milk-whole", quantity: 200, unit: "ML" },
      { id: "pr-6", productId: "esp-4", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      { id: "pr-7", productId: "esp-5", ingredientId: "ing-beans", quantity: 18, unit: "GRAM" },
      { id: "pr-8", productId: "esp-5", ingredientId: "ing-milk-whole", quantity: 180, unit: "ML" },
      { id: "pr-9", productId: "esp-5", ingredientId: "ing-ice", quantity: 120, unit: "GRAM" },
      { id: "pr-10", productId: "esp-5", ingredientId: "ing-cup-reg", quantity: 1, unit: "UNIT" },
      { id: "pr-11", productId: "fra-3", ingredientId: "ing-matcha", quantity: 15, unit: "GRAM" },
      { id: "pr-12", productId: "fra-3", ingredientId: "ing-milk-whole", quantity: 150, unit: "ML" },
      { id: "pr-13", productId: "fra-3", ingredientId: "ing-sugar-syrup", quantity: 25, unit: "ML" },
      { id: "pr-14", productId: "fra-3", ingredientId: "ing-ice", quantity: 180, unit: "GRAM" },
      { id: "pr-15", productId: "fra-3", ingredientId: "ing-cup-lrg", quantity: 1, unit: "UNIT" },
      { id: "pr-16", productId: "pas-1", ingredientId: "ing-pastry-croissant", quantity: 1, unit: "UNIT" },
      { id: "pr-17", productId: "pas-2", ingredientId: "ing-pastry-cookie", quantity: 1, unit: "UNIT" },
    ];

    // Telegram Bot Config
    this.telegramConfigs = [
      {
        id: "tg-cfg-1",
        tenantId,
        botToken: "7123456789:AAFxSampleTelegramBotTokenHere",
        chatId: "-1001987654321",
        notifyLowStock: true,
        notifyZReport: true,
        notifySpillage: true,
      },
    ];
  }
}

export const db = MockDataStore.getInstance();
