import { NextResponse } from "next/server";
import { InventoryService } from "@/modules/inventory/inventory.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId") || "store-bkk1";
  const ingredients = await InventoryService.getIngredients(storeId);
  const lowStockAlerts = await InventoryService.getLowStockAlerts(storeId);
  return NextResponse.json({ success: true, count: ingredients.length, ingredients, lowStockAlerts });
}
