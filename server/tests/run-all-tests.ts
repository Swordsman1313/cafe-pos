/**
 * Automated End-to-End Integration Test Suite for Café POS Backend & Engines
 */
import http from "http";
import { createApp } from "../src/app.js";
import { initSocketGateway } from "../src/modules/kds/kds.gateway.js";
import { escposService } from "../src/modules/hardware/escpos.service.js";
import { dynamicQRService } from "../src/modules/payments/dynamic-qr.service.js";
import { mockDb } from "../src/db/prisma.js";
import crypto from "crypto";
import { config } from "../src/config/index.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function request(serverUrl: string, method: string, path: string, body?: any, headers: Record<string, string> = {}) {
  const url = `${serverUrl}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 STARTING CAFÉ POS SYSTEM & ENGINE INTEGRATION TESTS");
  console.log("=======================================================\n");

  const app = createApp();
  const server = http.createServer(app);
  initSocketGateway(server);

  const testPort = 4099;
  await new Promise<void>((resolve) => server.listen(testPort, resolve));
  const serverUrl = `http://localhost:${testPort}/api/v1`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Quick Staff PIN Login & RBAC Token
    // -------------------------------------------------------------------------
    console.log("📌 TEST SUITE 1: Auth & PIN Quick Login");
    const loginRes = await request(serverUrl, "POST", "/auth/login-pin", { pin: "1234" });
    assert(loginRes.status === 200 && loginRes.body.success, "Staff PIN Login (1234) succeeds");
    assert(!!loginRes.body.data.token, "JWT token returned in login response");
    const token = loginRes.body.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    const invalidLogin = await request(serverUrl, "POST", "/auth/login-pin", { pin: "9999" });
    assert(invalidLogin.status === 401, "Invalid PIN correctly rejected with 401");

    // -------------------------------------------------------------------------
    // TEST 2: Catalog & Products
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 2: Menu Catalog & Modifiers");
    const catRes = await request(serverUrl, "GET", "/catalog/categories", undefined, authHeaders);
    assert(catRes.status === 200 && catRes.body.data.length >= 4, "Fetches categories list");

    const prodRes = await request(serverUrl, "GET", "/catalog/products", undefined, authHeaders);
    assert(prodRes.status === 200 && prodRes.body.data.length >= 10, "Fetches full product catalog with modifier groups");

    // -------------------------------------------------------------------------
    // TEST 3: Cash Shift & Cash Drawer Management
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 3: Cash Shift & Cash Movement");
    const openShiftRes = await request(
      serverUrl,
      "POST",
      "/shifts/open",
      { startingFloatUSD: 50.0, startingFloatKHR: 200000, notes: "Morning Shift Opening" },
      authHeaders
    );
    assert(openShiftRes.status === 201 && openShiftRes.body.success, "Opens new cash shift with $50.00 / 200,000 KHR float");
    const shiftId = openShiftRes.body.data.id;

    // Record Cash Movement (Pay In $20, Pay Out $5 for ice delivery)
    const payInRes = await request(
      serverUrl,
      "POST",
      "/shifts/movement",
      { shiftId, type: "PAY_IN", amountUSD: 20.0, reason: "Extra $1 notes float" },
      authHeaders
    );
    assert(payInRes.status === 201, "Records Pay In cash movement");

    const payOutRes = await request(
      serverUrl,
      "POST",
      "/shifts/movement",
      { shiftId, type: "PAY_OUT", amountUSD: 5.0, reason: "Emergency ice block purchase" },
      authHeaders
    );
    assert(payOutRes.status === 201, "Records Pay Out cash movement");

    // -------------------------------------------------------------------------
    // TEST 4: Atomic Checkout & Recursive BOM Inventory Engine
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 4: Atomic Checkout & Recursive BOM Inventory Engine");
    // Initial stock snapshot
    const initialBeans = mockDb.rawIngredients.find((i) => i.id === "ing-beans")?.currentStock || 0;
    const initialOatMilk = mockDb.rawIngredients.find((i) => i.id === "ing-milk-oat")?.currentStock || 0;
    const initialLrgCup = mockDb.rawIngredients.find((i) => i.id === "ing-cup-lrg")?.currentStock || 0;

    // Order 2x Iced Latte (Size: Large, Milk: Oat Milk) + 1x Butter Croissant
    const checkoutRes = await request(
      serverUrl,
      "POST",
      "/orders/checkout",
      {
        channel: "TAKEAWAY",
        items: [
          {
            productId: "esp-5", // Iced Latte
            quantity: 2,
            modifiers: [
              { groupName: "Size", optionName: "Large", priceDelta: 0.5 },
              { groupName: "Sweetness", optionName: "50%", priceDelta: 0.0 },
              { groupName: "Ice Level", optionName: "Less Ice", priceDelta: 0.0 },
              { groupName: "Milk Option", optionName: "Oat Milk", priceDelta: 0.6 },
            ],
          },
          {
            productId: "pas-1", // Butter Croissant
            quantity: 1,
          },
        ],
        payment: {
          method: "CASH_USD",
          amountUSD: 20.0,
          changeGivenUSD: 9.05,
        },
      },
      authHeaders
    );

    assert(checkoutRes.status === 201 && checkoutRes.body.success, "Atomic checkout transaction creates order");
    const orderData = checkoutRes.body.data.order;
    assert(orderData.ticketNumber === "1154", `Sequential daily ticket generated (#${orderData.ticketNumber})`);
    assert(orderData.total > 0, `Order total calculated correctly ($${orderData.total})`);

    // Verify BOM Deductions
    const newBeans = mockDb.rawIngredients.find((i) => i.id === "ing-beans")?.currentStock || 0;
    const newOatMilk = mockDb.rawIngredients.find((i) => i.id === "ing-milk-oat")?.currentStock || 0;
    const newLrgCup = mockDb.rawIngredients.find((i) => i.id === "ing-cup-lrg")?.currentStock || 0;

    assert(newBeans === initialBeans - 36, `Coffee beans deducted exactly: -36g (was ${initialBeans}, now ${newBeans})`);
    assert(newOatMilk === initialOatMilk - 520, `Oat milk deducted exactly (substituted whole milk): -520ml (was ${initialOatMilk}, now ${newOatMilk})`);
    assert(newLrgCup === initialLrgCup - 2, `Large cups deducted: -2 units (was ${initialLrgCup}, now ${newLrgCup})`);

    // -------------------------------------------------------------------------
    // TEST 5: KDS Real-time Lifecycle Transitions
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 5: Real-Time KDS Workflow & Status Transitions");
    const orderId = orderData.id;
    const prepRes = await request(serverUrl, "PATCH", `/orders/${orderId}/status`, { status: "PREPARING" }, authHeaders);
    assert(prepRes.body.data.status === "PREPARING", "Order transitioned: PENDING -> PREPARING");

    const readyRes = await request(serverUrl, "PATCH", `/orders/${orderId}/status`, { status: "READY" }, authHeaders);
    assert(readyRes.body.data.status === "READY", "Order transitioned: PREPARING -> READY");

    const completeRes = await request(serverUrl, "PATCH", `/orders/${orderId}/status`, { status: "COMPLETED" }, authHeaders);
    assert(completeRes.body.data.status === "COMPLETED", "Order transitioned: READY -> COMPLETED");

    // -------------------------------------------------------------------------
    // TEST 6: Close Shift & Z-Report
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 6: Close Shift & Z-Report Reconciliation");
    const currentShiftState = await request(serverUrl, "GET", "/shifts/current", undefined, authHeaders);
    const expectedUSD = currentShiftState.body.data.calculated.expectedUSD;

    const closeRes = await request(
      serverUrl,
      "POST",
      "/shifts/close",
      {
        shiftId,
        endingCashActualUSD: expectedUSD, // Exact match
        endingCashActualKHR: 200000,
        notes: "Shift closed smoothly",
      },
      authHeaders
    );

    assert(closeRes.status === 200 && closeRes.body.success, "Closes cash shift");
    assert(closeRes.body.data.shift.status === "CLOSED", "Shift marked as CLOSED");
    assert(closeRes.body.data.shift.overShortUSD === 0, "Cash drawer balanced (Over/Short is $0.00)");
    assert(!!closeRes.body.data.zReport, "Generates full Z-Report summary JSON");

    // -------------------------------------------------------------------------
    // TEST 7: Owner Analytics & Gross Margin / COGS
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 7: Owner Analytics & Gross Margin");
    const analyticsRes = await request(serverUrl, "GET", "/analytics/summary", undefined, authHeaders);
    assert(analyticsRes.status === 200 && analyticsRes.body.success, "Fetches analytics summary");
    assert(analyticsRes.body.data.summary.totalRevenueUSD > 0, "Computes gross sales revenue");
    assert(analyticsRes.body.data.summary.grossMarginPercent > 0, `Computes Gross Margin %: ${analyticsRes.body.data.summary.grossMarginPercent}%`);
    assert(analyticsRes.body.data.topProducts.length > 0, "Ranks top selling products");

    // -------------------------------------------------------------------------
    // TEST 8: ESC/POS Thermal Printer Buffer Generation
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 8: ESC/POS 80mm Binary Buffer Generation");
    const store = mockDb.stores[0];
    const receiptJob = escposService.generateCustomerReceipt(orderData, store);
    assert(Buffer.isBuffer(receiptJob.rawBuffer), "Generates binary Node Buffer for receipt");
    assert(receiptJob.rawBuffer.length > 100, `Thermal receipt buffer size: ${receiptJob.rawBuffer.length} bytes`);
    assert(receiptJob.hex.includes("1b70"), "Buffer contains cash drawer kick pulse (ESC p = 1b 70)");
    assert(receiptJob.hex.includes("1d56"), "Buffer contains paper cut command (GS V = 1d 56)");

    const kotJob = escposService.generateKitchenTicket(orderData);
    assert(kotJob.rawBuffer.length > 50, `KOT buffer generated (${kotJob.rawBuffer.length} bytes)`);

    // -------------------------------------------------------------------------
    // TEST 9: Dynamic QR (EMVCo/KHQR) & Webhook Verification
    // -------------------------------------------------------------------------
    console.log("\n📌 TEST SUITE 9: Dynamic QR Generation & Webhook Security");
    const qrResult = dynamicQRService.generateDynamicQR({
      orderId: "ORD-9999",
      amount: 4.5,
      currency: "USD",
      billNumber: "INV-1001155",
    });

    assert(qrResult.qrPayload.startsWith("000201010212"), "Payload follows EMVCo Tag 00/01 specification");
    assert(qrResult.qrPayload.includes("5802KH"), "Payload includes country Tag 58 (KH)");
    assert(qrResult.qrPayload.includes("6304"), "Payload contains CRC Tag 63");
    assert(qrResult.crc.length === 4, `Computed 16-bit CRC-CCITT: ${qrResult.crc}`);

    // Test Webhook processing with HMAC-SHA256
    const webhookPayload = {
      orderId: orderData.id,
      transactionRef: "KHQR-BANK-REF-998822",
      amount: orderData.total,
      status: "SUCCESS",
    };
    const rawBody = JSON.stringify(webhookPayload);
    const validSignature = crypto
      .createHmac("sha256", config.paymentWebhookSecret)
      .update(rawBody)
      .digest("hex");

    const webhookRes = await request(
      serverUrl,
      "POST",
      "/payments/webhook",
      webhookPayload,
      { "x-signature": validSignature }
    );
    assert(webhookRes.status === 200 && webhookRes.body.success, "Valid HMAC-signed webhook confirmed payment");

    const invalidWebhook = await request(
      serverUrl,
      "POST",
      "/payments/webhook",
      webhookPayload,
      { "x-signature": "tampered-invalid-sig" }
    );
    assert(invalidWebhook.status === 401, "Tampered webhook signature correctly rejected with 401");

    console.log("\n=======================================================");
    console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("=======================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test Suite Runner Error:", err);
  process.exit(1);
});
