import "server-only";

import { MANAGER_TTL_MS, SESSION_TTL_MS } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { hashSecret } from "@/lib/passwords";
import { setAuthCookies } from "@/lib/session";
import { hashToken, newToken } from "@/lib/tokens";
import type { RegisterValues } from "@/lib/validations/register.validation";

export type RegisteredManager = { name: string; storeName: string };

/**
 * Signup (docs/auth-flow.md 4.1). In one transaction: creates the store and
 * its manager (ACTIVE), trusts this phone as an approved Device, and starts a
 * Session. The manager just typed their password, so the session starts with
 * manager access. Then sets `sw_device` and `sw_session`.
 *
 * A taken username, email or phone surfaces as Prisma P2002, which
 * `createAction` maps to a CONFLICT with field errors. Nothing is saved and no
 * cookie is set in that case.
 */
export async function registerManager(
  values: RegisterValues,
): Promise<RegisteredManager> {
  const [passwordHash, pinHash] = await Promise.all([
    hashSecret(values.password),
    hashSecret(values.pin),
  ]);

  const deviceToken = newToken();
  const sessionToken = newToken();

  const manager = await db.$transaction(async (tx) => {
    const now = new Date();

    const store = await tx.store.create({
      data: {
        name: values.storeName,
        location: values.location || null,
        timezone: values.timezone,
        users: {
          create: {
            name: values.name,
            // Stored lowercase so the unique index is case-insensitive.
            username: values.username.trim().toLowerCase(),
            email: values.email.trim().toLowerCase(),
            // Already E.164 from `phoneSchema`.
            phone: values.phone,
            passwordHash,
            pinHash,
            role: "MANAGER",
            status: "ACTIVE",
            approvedAt: now,
          },
        },
      },
      select: { id: true, name: true, users: { select: { id: true, name: true } } },
    });
    const user = store.users[0];

    const device = await tx.device.create({
      data: {
        storeId: store.id,
        userId: user.id,
        tokenHash: hashToken(deviceToken),
        approvedAt: now,
        lastSeenAt: now,
      },
      select: { id: true },
    });

    await tx.session.create({
      data: {
        id: hashToken(sessionToken),
        userId: user.id,
        deviceId: device.id,
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
        managerUntil: new Date(now.getTime() + MANAGER_TTL_MS),
      },
    });

    return { name: user.name, storeName: store.name };
  });

  await setAuthCookies({ deviceToken, sessionToken });
  return manager;
}
