import { NextResponse } from "next/server";

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceLocation: "CENTRAL_WAREHOUSE" | "MAIN_BARISTA_COUNTER" | "BAKERY_SECTION" | "COLD_ROOM";
  destinationLocation: "CENTRAL_WAREHOUSE" | "MAIN_BARISTA_COUNTER" | "BAKERY_SECTION" | "COLD_ROOM";
  transferredAt: string;
  transferredBy: string;
  status: "COMPLETED" | "IN_TRANSIT" | "PENDING_APPROVAL";
  notes?: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }[];
}

let transfersStore: StockTransfer[] = [
  {
    id: "trf-001",
    transferNumber: "TRF-2026-0042",
    sourceLocation: "CENTRAL_WAREHOUSE",
    destinationLocation: "MAIN_BARISTA_COUNTER",
    transferredAt: "2026-08-25 06:45",
    transferredBy: "Dara (Shift 1 Cashier)",
    status: "COMPLETED",
    notes: "Morning bar restock for Shift 1 rush",
    items: [
      { ingredientId: "i-01", ingredientName: "Ethiopia Yirgacheffe Beans", quantity: 2000, unit: "g" },
      { ingredientId: "i-04", ingredientName: "Whole Milk", quantity: 12, unit: "L" },
      { ingredientId: "i-10", ingredientName: "12oz Hot Cups", quantity: 200, unit: "pcs" },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    transfers: transfersStore,
    total: transfersStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.sourceLocation || !body.destinationLocation || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Source, destination, and items are required." },
        { status: 400 }
      );
    }

    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`,
      sourceLocation: body.sourceLocation,
      destinationLocation: body.destinationLocation,
      transferredAt: new Date().toLocaleString([], { hour12: false }),
      transferredBy: body.transferredBy || "Staff",
      status: body.status || "COMPLETED",
      notes: body.notes || "",
      items: body.items,
    };

    transfersStore.unshift(newTransfer);

    return NextResponse.json({
      success: true,
      transfer: newTransfer,
      transfers: transfersStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
