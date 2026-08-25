import { NextResponse } from "next/server";

export interface CategoryData {
  id: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  station: "espresso" | "kitchen" | "pastry" | "retail";
  description?: string;
  productCount?: number;
}

let categoriesStore: CategoryData[] = [
  {
    id: "cat-1",
    name: "Espresso & Coffee",
    code: "ESP",
    icon: "Coffee",
    color: "amber",
    sortOrder: 1,
    isActive: true,
    station: "espresso",
    description: "Hot and iced handcrafted espresso beverages",
    productCount: 9,
  },
  {
    id: "cat-2",
    name: "Specialty Tea",
    code: "TEA",
    icon: "Leaf",
    color: "emerald",
    sortOrder: 2,
    isActive: true,
    station: "espresso",
    description: "Premium green teas, matchas, and floral infusions",
    productCount: 5,
  },
  {
    id: "cat-3",
    name: "Ice Frappé",
    code: "FRP",
    icon: "Snowflake",
    color: "sky",
    sortOrder: 3,
    isActive: true,
    station: "espresso",
    description: "Blended ice drinks with whipped cream toppings",
    productCount: 4,
  },
  {
    id: "cat-4",
    name: "Fresh Pastries",
    code: "PAS",
    icon: "Cookie",
    color: "amber",
    sortOrder: 4,
    isActive: true,
    station: "pastry",
    description: "Daily baked croissants, muffins, brownies, and cakes",
    productCount: 6,
  },
  {
    id: "cat-5",
    name: "Breakfast & Combos",
    code: "CMB",
    icon: "UtensilsCrossed",
    color: "purple",
    sortOrder: 5,
    isActive: true,
    station: "kitchen",
    description: "Morning perk pairings and afternoon tea bundles",
    productCount: 3,
  },
  {
    id: "cat-6",
    name: "Bottled & Retail Beans",
    code: "RTL",
    icon: "Package",
    color: "slate",
    sortOrder: 6,
    isActive: true,
    station: "retail",
    description: "Whole bean bags, cold brew bottles, and merchandise",
    productCount: 4,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: categoriesStore,
    total: categoriesStore.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: "Category name and code are required." },
        { status: 400 }
      );
    }

    const newCategory: CategoryData = {
      id: `cat-${Date.now()}`,
      name: body.name,
      code: body.code.toUpperCase(),
      icon: body.icon || "Coffee",
      color: body.color || "amber",
      sortOrder: body.sortOrder || categoriesStore.length + 1,
      isActive: body.isActive !== false,
      station: body.station || "espresso",
      description: body.description || "",
      productCount: 0,
    };

    categoriesStore.push(newCategory);

    return NextResponse.json({
      success: true,
      category: newCategory,
      categories: categoriesStore,
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
        { success: false, error: "Category ID is required for update." },
        { status: 400 }
      );
    }

    const index = categoriesStore.findIndex((c) => c.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Category not found." },
        { status: 404 }
      );
    }

    categoriesStore[index] = {
      ...categoriesStore[index],
      ...body,
      code: body.code ? body.code.toUpperCase() : categoriesStore[index].code,
    };

    return NextResponse.json({
      success: true,
      category: categoriesStore[index],
      categories: categoriesStore,
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
        { success: false, error: "Category ID is required." },
        { status: 400 }
      );
    }

    categoriesStore = categoriesStore.filter((c) => c.id !== id);

    return NextResponse.json({
      success: true,
      categories: categoriesStore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
