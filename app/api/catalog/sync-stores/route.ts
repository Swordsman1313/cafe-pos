import { NextResponse } from "next/server";
import { StoreSyncService } from "@/modules/catalog/store-sync.service";

export async function GET() {
  const branches = await StoreSyncService.getStoreBranches("tenant-001");
  return NextResponse.json({ success: true, branches });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await StoreSyncService.syncCatalogAcrossStores({
      tenantId: "tenant-001",
      targetStoreIds: body.targetStoreIds || ["store-bkk1", "store-ttp", "store-airport"],
      overridePriceTier: body.overridePriceTier,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
