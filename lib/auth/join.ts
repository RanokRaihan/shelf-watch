import "server-only";

import { connection } from "next/server";

import type { Prisma } from "@/app/generated/prisma/client";
import { SESSION_TTL_MS } from "@/lib/auth/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/core/errors";
import { recordFailedPin } from "@/lib/auth/lockout";
import { hashSecret, verifySecret } from "@/lib/auth/passwords";
import { assertGuest, setAuthCookies, setDeviceCookie } from "@/lib/auth/session";
import { hashToken, newToken } from "@/lib/auth/tokens";
import {
  joinTokenSchema,
  type JoinValues,
  type RejoinValues,
} from "@/lib/validations/join.validation";

/**
 * Colleague joins a store (docs/auth-flow.md 4.3). The store always comes
 * from the join link token, looked up here on the server; never from input.
 */

export type JoinStore = { name: string };
export type JoinedColleague = { storeName: string };

const INVALID_LINK =
  "This join link doesn't work anymore. Ask your manager for the store's current QR code.";

type Db = Prisma.TransactionClient | typeof db;

// The store of an active join link (not revoked, not expired), or null.
async function findActiveInvite(client: Db, token: string) {
  if (!joinTokenSchema.safeParse(token).success) return null;
  const now = new Date();
  return client.storeInvite.findFirst({
    where: {
      token,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { storeId: true, store: { select: { name: true } } },
  });
}

/** The store a join link belongs to, or null if the link is unknown or rotated. */
export async function getJoinStore(token: string): Promise<JoinStore | null> {
  // Request time only. With cacheComponents + partialPrefetching a cookie-less
  // prerender gets past `requireGuest()`, and `new Date()` below can't be
  // prerendered (blocking-prerender-current-time).
  await connection();
  const invite = await findActiveInvite(db, token);
  return invite ? { name: invite.store.name } : null;
}

/**
 * Creates a PENDING ASSOCIATE in the link's store and a Device for this phone
 * with `approvedAt` empty, in one transaction, then sets `sw_device`. No
 * session: the colleague can't do anything until a manager approves them,
 * after which `/unlock` shows their PIN screen.
 *
 * Refused with FORBIDDEN when this phone is signed in or already has a
 * trusted or pending device (no second account), and NOT_FOUND when the link
 * was rotated. A taken username or phone surfaces as P2002, which
 * `createAction` maps to a field error. Nothing is saved in those cases.
 */
export async function joinStore(values: JoinValues): Promise<JoinedColleague> {
  await assertGuest();

  const pinHash = await hashSecret(values.pin);
  const deviceToken = newToken();

  const joined = await db.$transaction(async (tx) => {
    // Looked up inside the transaction so a link rotated while the colleague
    // was typing is refused.
    const invite = await findActiveInvite(tx, values.token);
    if (!invite) throw new AppError("NOT_FOUND", INVALID_LINK);

    const user = await tx.user.create({
      data: {
        storeId: invite.storeId,
        name: values.name,
        // Already trimmed and lowercased by `usernameSchema`; lowercased again
        // so the unique index stays case-insensitive whatever the caller.
        username: values.username.trim().toLowerCase(),
        // Already E.164 from `phoneSchema`.
        phone: values.phone,
        pinHash,
        role: "ASSOCIATE",
        status: "PENDING",
      },
      select: { id: true },
    });

    await tx.device.create({
      data: {
        storeId: invite.storeId,
        userId: user.id,
        tokenHash: hashToken(deviceToken),
        // approvedAt stays empty until a manager approves (4.3 step 6).
      },
    });

    return { storeName: invite.store.name };
  });

  await setDeviceCookie(deviceToken);
  return joined;
}

const WRONG_LOGIN = "Wrong username or PIN.";

// Checked when there's no real user, so every failure takes about as long.
let dummyPinHash: Promise<string> | undefined;
function getDummyPinHash() {
  dummyPinHash ??= hashSecret("000000");
  return dummyPinHash;
}

/**
 * An existing ACTIVE member logs in on a phone with no device token
 * (docs/auth-flow.md 4.7). The store comes from the join link. No approval:
 * the member was already approved. On success the phone gets a new approved
 * device and a session, and every other device of the user is revoked.
 *
 * Every failure, a lock included, shows the same message so the public QR
 * can't be used to find usernames. Wrong PINs count toward the PIN lockout.
 */
export async function rejoinStore(values: RejoinValues): Promise<void> {
  await assertGuest();

  const invite = await findActiveInvite(db, values.token);
  if (!invite) throw new AppError("NOT_FOUND", INVALID_LINK);

  const user = await db.user.findFirst({
    where: { username: values.username.trim().toLowerCase(), storeId: invite.storeId },
    select: { id: true, status: true, pinHash: true, lockedUntil: true },
  });

  const now = Date.now();
  const locked = !!user?.lockedUntil && user.lockedUntil.getTime() > now;

  if (!user || user.status !== "ACTIVE" || locked) {
    await verifySecret(values.pin, await getDummyPinHash());
    throw new AppError("UNAUTHENTICATED", WRONG_LOGIN);
  }

  if (!(await verifySecret(values.pin, user.pinHash))) {
    await recordFailedPin(user.id, now);
    throw new AppError("UNAUTHENTICATED", WRONG_LOGIN);
  }

  const deviceToken = newToken();
  const sessionToken = newToken();
  const at = new Date(now);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: 0, lockedUntil: null },
    });
    // One phone per member: the old device tokens stop working right away.
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.device.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: at },
    });
    const device = await tx.device.create({
      data: {
        storeId: invite.storeId,
        userId: user.id,
        tokenHash: hashToken(deviceToken),
        approvedAt: at,
        lastSeenAt: at,
      },
      select: { id: true },
    });
    await tx.session.create({
      data: {
        id: hashToken(sessionToken),
        userId: user.id,
        deviceId: device.id,
        lastActiveAt: at,
        expiresAt: new Date(now + SESSION_TTL_MS),
      },
    });
  });

  await setAuthCookies({ deviceToken, sessionToken });
}
