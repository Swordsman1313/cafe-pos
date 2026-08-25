import { NextResponse } from "next/server";

export interface WriteOffEntry {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costLossUSD: number;
  reason: "SPOILAGE_EXPIRED" | "GRINDER_CALIBRATION" | "SPILLAGE_ACCIDENT" | "STAFF_TRAINING" | "DAMAGED_TRANSIT" | "COUNT_VARIANCE";
  reportedBy: string;
  timestamp: string;
  notes?: string;
}

let writeOffsStore: WriteOffEntry[] = [
  {
    id: "wo-1",
    ingredientId: "i-04",
    ingredientName: "Whole Milk",
    quantity: 1.5,
    unit: "L",
    costLossUSD: 1.80,
    reason: "SPOILAGE_EXPIRED",
    reportedBy: "Sophea (Barista)",
    timestamp: "2026-08-24 17:45",
    notes: "Sour batch after 3 days open",
  },
  {
    id: "wo-2",
    ingredientId: "i-01",
    ingredientName: "Ethiopia Yirgacheffe Beans",
    quantity: 120,
    unit: "g",
    costLossUSD: 2.16,
    reason: "GRINDER_CALIBRATION",
    reportedBy: "Dara (Cashier/Barista)",
    timestamp: "2026-08-25 07:10",
    notes: "Morning espresso dial-in dialing 1:2.2 ratio",
  },
  {
    id: "wo-3",
    ingredientId: "i-07",
    ingredientName: "Vanilla Syrup",
    quantity: 100,
    unit: "ml",
    costLossUSD: 0.30,
    reason: "SPILLAGE_ACCIDENT",
    reportedBy: "Pisey (Barista)",
    timestamp: "2026-08-25 09:20",
    notes: "Pump dispenser bottle dropped during peak rush",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    writeOffs: writeOffsStore,
    total: writeOffsStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.ingredientName || !body.quantity) {
      return NextResponse.json(
        { success: false, error: "Ingredient and quantity are required." },
        { status: 400 }
      );
    }

    const newEntry: WriteOffEntry = {
      id: `wo-${Date.now()}`,
      ingredientId: body.ingredientId || "i-custom",
      ingredientName: body.ingredientName,
      quantity: Number(body.quantity),
      unit: body.unit || "units",
      costLossUSD: Number(body.costLossUSD || 0),
      reason: body.reason || "SPILLAGE_ACCIDENT",
      reportedBy: body.reportedBy || "Staff",
      timestamp: new Date().toLocaleString([], { hour12: false }),
      notes: body.notes || "",
    };

    writeOffsStore.unshift(newEntry);

    return NextResponse.json({
      success: true,
      writeOff: newEntry,
      writeOffs: writeOffsStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
