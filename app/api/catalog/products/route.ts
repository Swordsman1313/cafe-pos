import { NextResponse } from "next/server";
import { CatalogService } from "@/modules/catalog/catalog.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const products = await CatalogService.getProducts("tenant-001", storeId, categoryId);
  return NextResponse.json({ success: true, count: products.length, products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await CatalogService.saveProduct({ ...body, tenantId: "tenant-001" });
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
