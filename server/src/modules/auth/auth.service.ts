import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mockDb } from "../../db/prisma.js";
import { config } from "../../config/index.js";
import { AppError } from "../../middleware/error.middleware.js";

export class AuthService {
  async quickPinLogin(pin: string, storeCode?: string) {
    if (!pin || pin.length < 4) {
      throw new AppError("PIN must be at least 4 digits", 400);
    }

    // Find staff whose PIN matches
    let matchedUser: any = null;
    for (const user of mockDb.users) {
      if (user.isActive && bcrypt.compareSync(pin, user.pinHash)) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new AppError("Invalid PIN or inactive staff profile", 401);
    }

    // Find store
    const store = storeCode
      ? mockDb.stores.find((s) => s.code === storeCode) || mockDb.stores[0]
      : mockDb.stores[0];

    const storeRole = mockDb.userStoreRoles.find(
      (r) => r.userId === matchedUser.id && r.storeId === store.id
    ) || { role: "CASHIER" };

    const payload = {
      userId: matchedUser.id,
      tenantId: matchedUser.tenantId,
      storeId: store.id,
      role: storeRole.role,
      name: matchedUser.name,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: 43200,
    });

    return {
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: storeRole.role,
      },
      store: {
        id: store.id,
        name: store.name,
        code: store.code,
        currency: store.currency,
        khrRate: store.khrRate,
        taxRate: store.taxRate,
      },
    };
  }

  async getStaffList(storeId: string) {
    return mockDb.users
      .filter((u) => u.isActive)
      .map((u) => {
        const role = mockDb.userStoreRoles.find(
          (r) => r.userId === u.id && r.storeId === storeId
        );
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: role ? role.role : "CASHIER",
        };
      });
  }
}

export const authService = new AuthService();
