import { NextResponse } from "next/server";

export interface OptionItem {
  id: string;
  name: string;
  extraPriceUSD: number;
  costUSD: number;
  isDefault: boolean;
  inventoryDeduction?: {
    ingredientId: string;
    ingredientName: string;
    qty: number;
    unit: string;
  };
}

export interface OptionGroup {
  id: string;
  name: string;
  code: string;
  selectionType: "single" | "multiple"; // radio vs checkbox
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  appliesToCategories: string[]; // ["cat-1", "cat-2"] or ["all"]
  options: OptionItem[];
  sortOrder: number;
}

let optionGroupsStore: OptionGroup[] = [
  {
    id: "og-1",
    name: "Cup Size",
    code: "SIZE",
    selectionType: "single",
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    appliesToCategories: ["cat-1", "cat-2", "cat-3"],
    sortOrder: 1,
    options: [
      { id: "opt-101", name: "Regular (12oz)", extraPriceUSD: 0.0, costUSD: 0.08, isDefault: true, inventoryDeduction: { ingredientId: "i-10", ingredientName: "12oz Hot Cups", qty: 1, unit: "pcs" } },
      { id: "opt-102", name: "Large (16oz)", extraPriceUSD: 0.6, costUSD: 0.15, isDefault: false, inventoryDeduction: { ingredientId: "i-11", ingredientName: "16oz Cold Cups", qty: 1, unit: "pcs" } },
    ],
  },
  {
    id: "og-2",
    name: "Sweetness Level",
    code: "SWEET",
    selectionType: "single",
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    appliesToCategories: ["cat-1", "cat-2", "cat-3"],
    sortOrder: 2,
    options: [
      { id: "opt-201", name: "100% Sugar (Standard)", extraPriceUSD: 0.0, costUSD: 0.02, isDefault: true },
      { id: "opt-202", name: "50% Sugar (Less Sweet)", extraPriceUSD: 0.0, costUSD: 0.01, isDefault: false },
      { id: "opt-203", name: "25% Sugar (Slightly Sweet)", extraPriceUSD: 0.0, costUSD: 0.005, isDefault: false },
      { id: "opt-204", name: "0% Sugar (No Sugar)", extraPriceUSD: 0.0, costUSD: 0.0, isDefault: false },
    ],
  },
  {
    id: "og-3",
    name: "Ice Level",
    code: "ICE",
    selectionType: "single",
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    appliesToCategories: ["cat-1", "cat-2", "cat-3"],
    sortOrder: 3,
    options: [
      { id: "opt-301", name: "Normal Ice", extraPriceUSD: 0.0, costUSD: 0.01, isDefault: true },
      { id: "opt-302", name: "Less Ice", extraPriceUSD: 0.0, costUSD: 0.01, isDefault: false },
      { id: "opt-303", name: "No Ice", extraPriceUSD: 0.0, costUSD: 0.0, isDefault: false },
    ],
  },
  {
    id: "og-4",
    name: "Milk Choice",
    code: "MILK",
    selectionType: "single",
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    appliesToCategories: ["cat-1", "cat-2"],
    sortOrder: 4,
    options: [
      { id: "opt-401", name: "Whole Milk (Default)", extraPriceUSD: 0.0, costUSD: 0.25, isDefault: true, inventoryDeduction: { ingredientId: "i-04", ingredientName: "Whole Milk", qty: 0.2, unit: "L" } },
      { id: "opt-402", name: "Oat Milk (Barista Edition)", extraPriceUSD: 0.60, costUSD: 0.42, isDefault: false, inventoryDeduction: { ingredientId: "i-05", ingredientName: "Oat Milk", qty: 0.2, unit: "L" } },
      { id: "opt-403", name: "Soy Milk", extraPriceUSD: 0.50, costUSD: 0.36, isDefault: false, inventoryDeduction: { ingredientId: "i-06", ingredientName: "Soy Milk", qty: 0.2, unit: "L" } },
    ],
  },
  {
    id: "og-5",
    name: "Espresso Beans / Roast",
    code: "BEANS",
    selectionType: "single",
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    appliesToCategories: ["cat-1"],
    sortOrder: 5,
    options: [
      { id: "opt-501", name: "House Espresso Blend", extraPriceUSD: 0.0, costUSD: 0.27, isDefault: true, inventoryDeduction: { ingredientId: "i-03", ingredientName: "House Espresso Blend", qty: 18, unit: "g" } },
      { id: "opt-502", name: "Ethiopia Yirgacheffe Single Origin", extraPriceUSD: 0.75, costUSD: 0.36, isDefault: false, inventoryDeduction: { ingredientId: "i-01", ingredientName: "Ethiopia Yirgacheffe Beans", qty: 18, unit: "g" } },
    ],
  },
  {
    id: "og-6",
    name: "Condiments, Syrups & Add-ons",
    code: "CONDIMENTS",
    selectionType: "multiple",
    isRequired: false,
    minSelect: 0,
    maxSelect: 5,
    appliesToCategories: ["cat-1", "cat-2", "cat-3"],
    sortOrder: 6,
    options: [
      { id: "opt-601", name: "Extra Espresso Shot (+18g)", extraPriceUSD: 0.75, costUSD: 0.27, isDefault: false, inventoryDeduction: { ingredientId: "i-03", ingredientName: "House Espresso Blend", qty: 18, unit: "g" } },
      { id: "opt-602", name: "Vanilla Syrup Pump (15ml)", extraPriceUSD: 0.50, costUSD: 0.05, isDefault: false, inventoryDeduction: { ingredientId: "i-07", ingredientName: "Vanilla Syrup", qty: 15, unit: "ml" } },
      { id: "opt-603", name: "Caramel Drizzle (15ml)", extraPriceUSD: 0.50, costUSD: 0.05, isDefault: false, inventoryDeduction: { ingredientId: "i-08", ingredientName: "Caramel Syrup", qty: 15, unit: "ml" } },
      { id: "opt-604", name: "Hazelnut Syrup (15ml)", extraPriceUSD: 0.50, costUSD: 0.05, isDefault: false, inventoryDeduction: { ingredientId: "i-09", ingredientName: "Hazelnut Syrup", qty: 15, unit: "ml" } },
      { id: "opt-605", name: "Fresh Whipped Cream", extraPriceUSD: 0.50, costUSD: 0.12, isDefault: false },
      { id: "opt-606", name: "Salted Cheese Foam", extraPriceUSD: 0.75, costUSD: 0.20, isDefault: false },
      { id: "opt-607", name: "Brown Sugar Konjac Jelly", extraPriceUSD: 0.50, costUSD: 0.10, isDefault: false },
    ],
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    optionGroups: optionGroupsStore,
    total: optionGroupsStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: "Option Group name and code are required." },
        { status: 400 }
      );
    }

    const newGroup: OptionGroup = {
      id: `og-${Date.now()}`,
      name: body.name,
      code: body.code.toUpperCase(),
      selectionType: body.selectionType || "single",
      isRequired: body.isRequired || false,
      minSelect: body.minSelect || 0,
      maxSelect: body.maxSelect || 1,
      appliesToCategories: body.appliesToCategories || ["all"],
      options: body.options || [],
      sortOrder: body.sortOrder || optionGroupsStore.length + 1,
    };

    optionGroupsStore.push(newGroup);

    return NextResponse.json({
      success: true,
      optionGroup: newGroup,
      optionGroups: optionGroupsStore,
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
        { success: false, error: "Option Group ID is required for update." },
        { status: 400 }
      );
    }

    const index = optionGroupsStore.findIndex((g) => g.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Option Group not found." },
        { status: 404 }
      );
    }

    optionGroupsStore[index] = {
      ...optionGroupsStore[index],
      ...body,
      code: body.code ? body.code.toUpperCase() : optionGroupsStore[index].code,
    };

    return NextResponse.json({
      success: true,
      optionGroup: optionGroupsStore[index],
      optionGroups: optionGroupsStore,
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
        { success: false, error: "Option Group ID is required." },
        { status: 400 }
      );
    }

    optionGroupsStore = optionGroupsStore.filter((g) => g.id !== id);

    return NextResponse.json({
      success: true,
      optionGroups: optionGroupsStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
