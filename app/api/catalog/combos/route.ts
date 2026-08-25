import { NextResponse } from "next/server";

export interface ComboItem {
  id: string;
  name: string;
  code: string;
  comboPriceUSD: number;
  regularPriceUSD: number;
  savingUSD: number;
  availableDays: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  timeWindow: string; // e.g. "06:30 AM - 11:00 AM"
  isActive: boolean;
  sections: {
    title: string;
    required: boolean;
    productIds: string[];
    defaultProductId?: string;
  }[];
}

let combosStore: ComboItem[] = [
  {
    id: "cmb-1",
    name: "Morning Perk: Coffee + Fresh Croissant",
    code: "PERK-AM",
    comboPriceUSD: 4.50,
    regularPriceUSD: 5.25,
    savingUSD: 0.75,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    timeWindow: "06:30 AM - 11:30 AM",
    isActive: true,
    sections: [
      {
        title: "Select Morning Coffee",
        required: true,
        productIds: ["p1", "p2", "p3", "p4", "p8"],
        defaultProductId: "p2",
      },
      {
        title: "Select Breakfast Pastry",
        required: true,
        productIds: ["p19", "p20", "p21"],
        defaultProductId: "p19",
      },
    ],
  },
  {
    id: "cmb-2",
    name: "Afternoon Delight: Frappé & Artisan Cake",
    code: "DELIGHT-PM",
    comboPriceUSD: 7.00,
    regularPriceUSD: 8.75,
    savingUSD: 1.75,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    timeWindow: "01:00 PM - 05:30 PM",
    isActive: true,
    sections: [
      {
        title: "Select Frappé",
        required: true,
        productIds: ["p15", "p16", "p17", "p18"],
        defaultProductId: "p15",
      },
      {
        title: "Select Cake / Pastry",
        required: true,
        productIds: ["p22", "p23", "p24"],
        defaultProductId: "p23",
      },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    combos: combosStore,
    total: combosStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.comboPriceUSD) {
      return NextResponse.json(
        { success: false, error: "Combo name and bundle price are required." },
        { status: 400 }
      );
    }

    const reg = body.regularPriceUSD || body.comboPriceUSD;
    const save = Math.max(0, reg - body.comboPriceUSD);

    const newCombo: ComboItem = {
      id: `cmb-${Date.now()}`,
      name: body.name,
      code: body.code ? body.code.toUpperCase() : `CMB-${Date.now().toString().slice(-4)}`,
      comboPriceUSD: Number(body.comboPriceUSD),
      regularPriceUSD: Number(reg),
      savingUSD: Number(save.toFixed(2)),
      availableDays: body.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      timeWindow: body.timeWindow || "All Day",
      isActive: body.isActive !== false,
      sections: body.sections || [],
    };

    combosStore.push(newCombo);

    return NextResponse.json({
      success: true,
      combo: newCombo,
      combos: combosStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Combo ID is required for update." },
        { status: 400 }
      );
    }

    const index = combosStore.findIndex((c) => c.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Combo not found." },
        { status: 404 }
      );
    }

    const reg = body.regularPriceUSD !== undefined ? body.regularPriceUSD : combosStore[index].regularPriceUSD;
    const price = body.comboPriceUSD !== undefined ? body.comboPriceUSD : combosStore[index].comboPriceUSD;
    const save = Math.max(0, reg - price);

    combosStore[index] = {
      ...combosStore[index],
      ...body,
      savingUSD: Number(save.toFixed(2)),
    };

    return NextResponse.json({
      success: true,
      combo: combosStore[index],
      combos: combosStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Combo ID is required." },
        { status: 400 }
      );
    }

    combosStore = combosStore.filter((c) => c.id !== id);

    return NextResponse.json({
      success: true,
      combos: combosStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
