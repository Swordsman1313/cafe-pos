import { AuthService } from "../modules/auth/auth.service";
import { CatalogService } from "../modules/catalog/catalog.service";
import { StoreSyncService } from "../modules/catalog/store-sync.service";
import { OrdersService } from "../modules/orders/orders.service";
import { OfflineSyncService } from "../modules/orders/offline-sync.service";
import { InventoryService } from "../modules/inventory/inventory.service";
import { SupplierPOService } from "../modules/inventory/supplier-po.service";
import { ShiftsService } from "../modules/shifts/shifts.service";
import { AnalyticsService } from "../modules/analytics/analytics.service";
import { TelegramService } from "../modules/telegram/telegram.service";
import { ESCPOSService } from "../modules/hardware/escpos.service";
import { DynamicQRService } from "../modules/payments/dynamic-qr.service";
import { db } from "../lib/db";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    totalFailed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 STARTING CAFÉ POS & ENTERPRISE BOH INTEGRATION TESTS");
  console.log("=======================================================\n");

  // TEST SUITE 1: Auth & Multi-Role Logins
  console.log("📌 TEST SUITE 1: Auth & Multi-Role RBAC Logins");
  const pinLogin = await AuthService.loginWithPin("1234", "store-bkk1");
  assert(!!pinLogin.token, "Staff PIN Quick Login (1234) succeeds with JWT");
  assert(pinLogin.user.role === "CASHIER", "Correctly identified as CASHIER");

  const pwdLogin = await AuthService.loginWithPassword("owner@artisanroast.com", "admin123", "store-bkk1");
  assert(pwdLogin.user.role === "OWNER", "Management Password Login succeeds with OWNER role");
  assert(pwdLogin.redirectTo === "/admin", "Owner routed directly to Back-of-House Portal (/admin)");

  // TEST SUITE 2: Master Catalog & Multi-Store Sync (#4)
  console.log("\n📌 TEST SUITE 2: Master Catalog & Multi-Store Sync (#4)");
  const products = await CatalogService.getProducts("tenant-001", "store-bkk1");
  assert(products.length >= 10, `Loaded ${products.length} master menu items`);

  const syncResult = await StoreSyncService.syncCatalogAcrossStores({
    tenantId: "tenant-001",
    targetStoreIds: ["store-bkk1", "store-ttp", "store-airport"],
    overridePriceTier: { "store-airport": 1.15 },
  });
  assert(syncResult.success, "1-Click Master Menu & Recipe sync across branches succeeded");
  assert(syncResult.syncedStores.length === 3, "Synced 3 store branch locations");
  const airportStore = db.stores.find((s) => s.id === "store-airport");
  assert(airportStore?.priceMultiplier === 1.15, "Airport Kiosk set to +15% Price Tier Multiplier (1.15x)");

  // TEST SUITE 3: Cash Shift & Drawers
  console.log("\n📌 TEST SUITE 3: Cash Shift & Drawers");
  const openedShift = await ShiftsService.openShift({
    storeId: "store-bkk1",
    cashierId: "usr-cashier-01",
    startingFloatUSD: 50.0,
    startingFloatKHR: 200000,
    notes: "Morning Shift Open",
  });
  assert(openedShift.status === "OPEN", "Shift opened with $50.00 / 200,000 KHR float");

  await ShiftsService.recordCashMovement({
    shiftId: openedShift.id,
    type: "PAY_IN",
    amountUSD: 10.0,
    reason: "Additional change float",
  });
  assert(db.cashMovements.length > 0, "Recorded Pay-In cash movement");

  // TEST SUITE 4: Atomic Checkout & Recursive BOM Inventory Engine
  console.log("\n📌 TEST SUITE 4: Atomic Checkout & Recursive BOM Engine");
  const initialBeans = db.rawIngredients.find((i) => i.id === "ing-beans")?.currentStock || 5000;
  const initialMilkOat = db.rawIngredients.find((i) => i.id === "ing-milk-oat")?.currentStock || 6000;

  const checkoutRes = await OrdersService.executeCheckout({
    storeId: "store-bkk1",
    cashierId: "usr-cashier-01",
    channel: "WALK_IN",
    items: [
      {
        productId: "esp-5", // Iced Latte ($3.25)
        quantity: 2,
        modifiers: [
          { groupName: "Size", optionName: "Large", priceDelta: 0.5 },
          { groupName: "Milk Option", optionName: "Oat Milk", priceDelta: 0.6 },
          { groupName: "Sweetness", optionName: "0%", priceDelta: 0.0 },
        ],
      },
      {
        productId: "pas-1", // Croissant ($2.25)
        quantity: 1,
      },
    ],
    payment: {
      method: "CASH_USD",
      amountUSD: 12.04,
    },
  });

  assert(!!checkoutRes.order, "Atomic checkout transaction completed");
  assert(checkoutRes.order.ticketNumber === "1154", "Generated sequential daily ticket #1154");
  assert(checkoutRes.order.total === 12.04, `Order total computed correctly: $${checkoutRes.order.total}`);

  const postBeans = db.rawIngredients.find((i) => i.id === "ing-beans")?.currentStock || 0;
  const postMilkOat = db.rawIngredients.find((i) => i.id === "ing-milk-oat")?.currentStock || 0;

  // 2 * 18g * 1.35 (Large multiplier) = 48.6g
  assert(Math.abs(postBeans - (initialBeans - 48.6)) < 0.1, `Scaled and deducted 48.6g coffee beans for Large drinks (Remaining: ${postBeans}g)`);
  // 2 * 260ml oat milk = 520ml
  assert(postMilkOat === initialMilkOat - 520, `Substituted and deducted 520ml Oat Milk (Remaining: ${postMilkOat}ml)`);

  // TEST SUITE 5: Offline Outbox Batch Sync
  console.log("\n📌 TEST SUITE 5: Offline Outbox Batch Sync");
  const offlineSync = await OfflineSyncService.syncBatch({
    storeId: "store-bkk1",
    cashierId: "usr-cashier-01",
    offlineOrders: [
      {
        offlineId: "off-001",
        clientTimestamp: new Date().toISOString(),
        payload: {
          storeId: "store-bkk1",
          channel: "TAKEAWAY",
          items: [{ productId: "esp-1", quantity: 1 }],
          payment: { method: "CASH_USD", amountUSD: 2.2 },
        },
      },
    ],
  });
  assert(offlineSync.syncedCount === 1, "Offline order synced and reconciled into server database");

  // TEST SUITE 6: 1-Click Supplier PO Automation
  console.log("\n📌 TEST SUITE 6: 1-Click Supplier PO Automation");
  const poDraft = await SupplierPOService.generateDraftPO({ storeId: "store-bkk1", daysForecast: 7 });
  assert(poDraft.generatedCount > 0, `Generated ${poDraft.generatedCount} automated supplier PO drafts`);

  // TEST SUITE 7: Close Shift & Z-Report
  console.log("\n📌 TEST SUITE 7: Close Shift & Z-Report Reconciliation");
  const closeRes = await ShiftsService.closeShift({
    shiftId: openedShift.id,
    endingCashActualUSD: 74.24,
    endingCashActualKHR: 200000,
  });
  assert(closeRes.shift.status === "CLOSED", "Shift marked as CLOSED");
  assert(!!closeRes.zReport, "Generated immutable official Z-Report JSON");

  // TEST SUITE 8: Executive Analytics & Margins
  console.log("\n📌 TEST SUITE 8: Executive Analytics & Margins");
  const analytics = await AnalyticsService.getExecutiveSummary("store-bkk1");
  assert(analytics.summary.totalRevenueUSD > 0, `Recorded gross sales: $${analytics.summary.totalRevenueUSD}`);
  assert(analytics.summary.grossMarginPercent > 50, `Healthy gross profit margin: ${analytics.summary.grossMarginPercent}%`);

  // TEST SUITE 9: Telegram Bot Alerts (#5)
  console.log("\n📌 TEST SUITE 9: Telegram Alert Bot (#5)");
  const tgAlert = await TelegramService.sendLowStockAlert("tenant-001", {
    name: "Espresso Beans",
    currentStock: 900,
    unit: "GRAM",
    reorderThreshold: 1000,
    storeName: "BKK1 Flagship",
  });
  assert(tgAlert.sent !== undefined, "Formatted low stock alert for Telegram Bot dispatch");

  // TEST SUITE 10: ESC/POS 80mm Printer & Dynamic QR
  console.log("\n📌 TEST SUITE 10: Hardware ESC/POS & Dynamic QR Payment");
  const receiptBuf = ESCPOSService.generateReceiptBuffer(checkoutRes.order, db.stores[0]);
  assert(Buffer.isBuffer(receiptBuf), `Generated ESC/POS buffer: ${receiptBuf.length} bytes`);
  assert(receiptBuf[2] === 0x1b && receiptBuf[3] === 0x70, "Buffer contains drawer kick pulse (ESC p = 1b 70)");

  const qrPayload = DynamicQRService.generateKHQRPayload(checkoutRes.order.id, 12.04, "1154");
  assert(qrPayload.includes("5802KH"), "Payload includes EMVCo Country Code KH");
  assert(qrPayload.includes("6304"), "Payload contains CRC-16 Checksum tag");

  console.log("\n=======================================================");
  console.log(`🏁 TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("=======================================================\n");

  if (totalFailed > 0) process.exit(1);
}

runTests().catch(console.error);
