import { Request, Response, NextFunction } from "express";

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  const tenantSlug = req.headers["x-tenant-slug"] as string;
  const storeId = (req.headers["x-store-id"] as string) || req.user?.storeId || "store-001";
  
  req.storeId = storeId;
  if (tenantSlug) {
    req.tenantId = tenantSlug;
  }
  next();
}
