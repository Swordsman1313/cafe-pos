import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { AppError } from "./error.middleware.js";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  storeId: string;
  role: "OWNER" | "MANAGER" | "CASHIER" | "BARISTA";
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
      storeId?: string;
    }
  }
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // For demo convenience, allow X-Store-Id and X-Staff-Role if no Bearer token
    const storeId = (req.headers["x-store-id"] as string) || "store-001";
    const role = (req.headers["x-staff-role"] as any) || "CASHIER";
    req.user = {
      userId: "user-cashier-01",
      tenantId: "tenant-001",
      storeId,
      role,
      name: "Staff",
    };
    req.tenantId = "tenant-001";
    req.storeId = storeId;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
    req.user = payload;
    req.tenantId = payload.tenantId;
    req.storeId = payload.storeId;
    next();
  } catch (err) {
    throw new AppError("Invalid or expired session token", 401);
  }
}

export function requireRole(...allowedRoles: Array<"OWNER" | "MANAGER" | "CASHIER" | "BARISTA">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(`Access forbidden: requires role in [${allowedRoles.join(", ")}]`, 403);
    }
    next();
  };
}
