import "server-only";

import { db } from "@/lib/db";
import { hashSecret } from "@/lib/passwords";
import type { RegisterValues } from "@/lib/validations/register.validation";

export type RegisteredManager = { storeName: string; username: string };

/**
 * Creates a store and its first user, the manager, in one nested write
 * (atomic). A taken username or email surfaces as Prisma P2002, which
 * `createAction` maps to a CONFLICT with field errors.
 */
export async function registerManager(
  values: RegisterValues,
): Promise<RegisteredManager> {
  const [passwordHash, pinHash] = await Promise.all([
    hashSecret(values.password),
    hashSecret(values.pin),
  ]);

  const store = await db.store.create({
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
          approvedAt: new Date(),
        },
      },
    },
    select: { name: true, users: { select: { username: true } } },
  });

  return { storeName: store.name, username: store.users[0].username };
}
