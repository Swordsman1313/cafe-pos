import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-for-cafe-pos-saas-2026";

export interface SessionUser {
  userId: string;
  tenantId: string;
  storeId: string;
  role: "OWNER" | "STORE_MANAGER" | "SUPERVISOR" | "CASHIER" | "BARISTA";
  name: string;
  email?: string | null;
}

export class AuthService {
  /**
   * Fast 4-6 digit staff PIN authentication for Cashiers, Baristas, and In-Store Staff
   */
  public static async loginWithPin(pin: string, storeId = "store-bkk1") {
    if (!pin || pin.length < 4) {
      throw new Error("PIN must be at least 4 digits");
    }

    let matchedUser: any = null;
    for (const user of db.users) {
      if (user.isActive && user.pinHash && bcrypt.compareSync(pin, user.pinHash)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new Error("Invalid staff PIN or inactive account");
    }

    const store = db.stores.find((s) => s.id === storeId) || db.stores[0];
    const storeRole = db.userStoreRoles.find(
      (r) => r.userId === matchedUser.id && r.storeId === store.id
    ) || { role: "CASHIER" };

    const sessionUser: SessionUser = {
      userId: matchedUser.id,
      tenantId: matchedUser.tenantId,
      storeId: store.id,
      role: storeRole.role,
      name: matchedUser.name,
      email: matchedUser.email,
    };

    const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: "12h" });

    return {
      token,
      user: sessionUser,
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        priceMultiplier: store.priceMultiplier,
        khrRate: store.khrRate,
        taxRate: store.taxRate,
      },
      redirectTo:
        storeRole.role === "OWNER" || storeRole.role === "STORE_MANAGER"
          ? "/admin"
          : storeRole.role === "SUPERVISOR"
          ? "/admin"
          : storeRole.role === "BARISTA"
          ? "/kds"
          : "/pos",
    };
  }

  /**
   * Email and Password login for Supervisors, Store Managers, and Store Owners
   */
  public static async loginWithPassword(email: string, password: string, storeId = "store-bkk1") {
    const user = db.users.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.isActive);
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new Error("Invalid management credentials");
    }

    const store = db.stores.find((s) => s.id === storeId) || db.stores[0];
    const storeRole = db.userStoreRoles.find((r) => r.userId === user.id) || { role: "OWNER" };

    const sessionUser: SessionUser = {
      userId: user.id,
      tenantId: user.tenantId,
      storeId: store.id,
      role: storeRole.role,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: "24h" });

    return {
      token,
      user: sessionUser,
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        priceMultiplier: store.priceMultiplier,
      },
      redirectTo: "/admin",
    };
  }

  public static verifyToken(token: string): SessionUser {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  }
}
