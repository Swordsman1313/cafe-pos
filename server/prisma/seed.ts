import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Café POS PostgreSQL database...");

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "artisan-roast" },
    update: {},
    create: {
      name: "Artisan Roast Café",
      slug: "artisan-roast",
      plan: "ENTERPRISE",
    },
  });

  // 2. Create Store
  const store = await prisma.store.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "BKK1-STORE",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Artisan Roast - Flagship BKK1",
      code: "BKK1-STORE",
      address: "Street 302, BKK1, Phnom Penh",
      phone: "+855 23 888 999",
      currency: "USD",
      khrRate: 4000.0,
      taxRate: 0.10,
      currentTicketSeq: 1153,
    },
  });

  // 3. Create Users with Hashed PIN ("1234")
  const pinHash = await bcrypt.hash("1234", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@artisanroast.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Sovann (Owner)",
      email: "owner@artisanroast.com",
      pinHash,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@artisanroast.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Dara (Barista / Cashier)",
      email: "cashier@artisanroast.com",
      pinHash,
    },
  });

  // Assign store roles
  await prisma.userStoreRole.upsert({
    where: { userId_storeId: { userId: owner.id, storeId: store.id } },
    update: {},
    create: { userId: owner.id, storeId: store.id, role: "OWNER" },
  });

  await prisma.userStoreRole.upsert({
    where: { userId_storeId: { userId: cashier.id, storeId: store.id } },
    update: {},
    create: { userId: cashier.id, storeId: store.id, role: "CASHIER" },
  });

  // 4. Raw Ingredients
  const ingredients = [
    { sku: "ING-BEAN", name: "Espresso Coffee Beans (Arabica)", unit: "GRAM" as const, currentStock: 5000, reorderThreshold: 1000, costPerUnit: 0.022 },
    { sku: "ING-MILK-W", name: "Whole Fresh Milk", unit: "ML" as const, currentStock: 12000, reorderThreshold: 2000, costPerUnit: 0.0025 },
    { sku: "ING-MILK-OAT", name: "Oat Milk (Barista Edition)", unit: "ML" as const, currentStock: 6000, reorderThreshold: 1500, costPerUnit: 0.0045 },
    { sku: "ING-SYRUP", name: "Cane Sugar Syrup", unit: "ML" as const, currentStock: 4000, reorderThreshold: 800, costPerUnit: 0.003 },
    { sku: "ING-MATCHA", name: "Uji Matcha Powder", unit: "GRAM" as const, currentStock: 1500, reorderThreshold: 300, costPerUnit: 0.06 },
    { sku: "ING-TEA-JAS", name: "Jasmine Green Tea Leaves", unit: "GRAM" as const, currentStock: 2000, reorderThreshold: 400, costPerUnit: 0.03 },
    { sku: "ING-ICE", name: "Purified Ice Cubes", unit: "GRAM" as const, currentStock: 25000, reorderThreshold: 5000, costPerUnit: 0.0005 },
    { sku: "ING-CUP-12OZ", name: "12oz Eco Paper Cup + Lid", unit: "UNIT" as const, currentStock: 350, reorderThreshold: 80, costPerUnit: 0.12 },
    { sku: "ING-CUP-16OZ", name: "16oz Eco Paper Cup + Lid", unit: "UNIT" as const, currentStock: 280, reorderThreshold: 60, costPerUnit: 0.15 },
  ];

  for (const ing of ingredients) {
    await prisma.rawIngredient.upsert({
      where: { storeId_sku: { storeId: store.id, sku: ing.sku } },
      update: {},
      create: {
        tenantId: tenant.id,
        storeId: store.id,
        sku: ing.sku,
        name: ing.name,
        unit: ing.unit,
        currentStock: ing.currentStock,
        reorderThreshold: ing.reorderThreshold,
        costPerUnit: ing.costPerUnit,
      },
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
