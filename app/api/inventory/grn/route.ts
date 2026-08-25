import { NextResponse } from "next/server";

export interface GRNItem {
  ingredientId: string;
  ingredientName: string;
  receivedQty: number;
  unit: string;
  unitCostUSD: number;
  totalCostUSD: number;
  lotNumber?: string;
  expiryDate?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  supplierName: string;
  invoiceNumber: string;
  receivedAt: string;
  receivedBy: string;
  paymentStatus: "PAID" | "PENDING_NET30" | "COD";
  totalAmountUSD: number;
  notes?: string;
  items: GRNItem[];
}

let grnStore: GoodsReceivedNote[] = [
  {
    id: "grn-001",
    grnNumber: "GRN-2026-0819",
    supplierName: "Cloud9 Coffee Importers",
    invoiceNumber: "INV-C9-9821",
    receivedAt: "2026-08-24 14:30",
    receivedBy: "Vannak (Manager)",
    paymentStatus: "PAID",
    totalAmountUSD: 240.0,
    notes: "Fresh Ethiopia Yirgacheffe batch (Roasted Aug 20)",
    items: [
      { ingredientId: "i-01", ingredientName: "Ethiopia Yirgacheffe Beans", receivedQty: 10000, unit: "g", unitCostUSD: 0.018, totalCostUSD: 180.0, lotNumber: "LOT-ETH-882", expiryDate: "2027-02-20" },
      { ingredientId: "i-03", ingredientName: "House Espresso Blend", receivedQty: 5000, unit: "g", unitCostUSD: 0.012, totalCostUSD: 60.0, lotNumber: "LOT-HOU-419", expiryDate: "2027-01-15" },
    ],
  },
  {
    id: "grn-002",
    grnNumber: "GRN-2026-0820",
    supplierName: "Dairy Fresh Co.",
    invoiceNumber: "INV-DF-5510",
    receivedAt: "2026-08-25 06:15",
    receivedBy: "Sophea (Barista)",
    paymentStatus: "COD",
    totalAmountUSD: 54.0,
    notes: "Cold storage temperature verified 3.5°C",
    items: [
      { ingredientId: "i-04", ingredientName: "Whole Milk", receivedQty: 30, unit: "L", unitCostUSD: 1.20, totalCostUSD: 36.0, expiryDate: "2026-09-05" },
      { ingredientId: "i-05", ingredientName: "Oat Milk (Barista)", receivedQty: 10, unit: "L", unitCostUSD: 1.80, totalCostUSD: 18.0, expiryDate: "2026-11-20" },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    grnRecords: grnStore,
    total: grnStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.supplierName || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier name and received items are required." },
        { status: 400 }
      );
    }

    const calculatedTotal = body.items.reduce(
      (sum: number, item: GRNItem) => sum + (item.receivedQty * item.unitCostUSD),
      0
    );

    const newGRN: GoodsReceivedNote = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: body.supplierName,
      invoiceNumber: body.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      receivedAt: new Date().toLocaleString([], { hour12: false }),
      receivedBy: body.receivedBy || "Supervisor",
      paymentStatus: body.paymentStatus || "PENDING_NET30",
      totalAmountUSD: Number(calculatedTotal.toFixed(2)),
      notes: body.notes || "",
      items: body.items,
    };

    grnStore.unshift(newGRN);

    return NextResponse.json({
      success: true,
      grn: newGRN,
      grnRecords: grnStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
