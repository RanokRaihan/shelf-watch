import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { appOrigin } from "@/lib/core/app-url";
import { db } from "@/lib/db";
import { newToken } from "@/lib/auth/tokens";

/**
 * Store join links (docs/auth-flow.md 4.2). Each store has one active
 * `StoreInvite` at a time. Its token is stored as plain text, the one
 * exception to hash-only tokens (auth-flow 5): the link is printed on the
 * wall anyway, and joining still needs manager approval. Store links have no
 * expiry (`expiresAt` null); Rotate is the only way to turn one off.
 *
 * Callers pass the store and user from the session (`requireManager()`),
 * never from client input.
 */
export type InviteOwner = { storeId: string; userId: string };

export type JoinLink = { token: string; url: string };

type Tx = Prisma.TransactionClient;

// Serializes join-link changes per store: two managers opening the page at
// once, or a Rotate racing a first visit, still end with one active link.
async function lockStore(tx: Tx, storeId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Store" WHERE id = ${storeId} FOR UPDATE`;
}

function activeWhere(storeId: string, now: Date): Prisma.StoreInviteWhereInput {
  return {
    storeId,
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

async function createInvite(tx: Tx, owner: InviteOwner): Promise<string> {
  const invite = await tx.storeInvite.create({
    data: { storeId: owner.storeId, createdById: owner.userId, token: newToken() },
    select: { token: true },
  });
  return invite.token;
}

async function toJoinLink(token: string): Promise<JoinLink> {
  return { token, url: `${await appOrigin()}/join/${token}` };
}

/**
 * The store's active join link, created on the first visit if there is none.
 */
export async function getOrCreateJoinLink(owner: InviteOwner): Promise<JoinLink> {
  const now = new Date();
  // Fast path without a lock: almost every visit finds the existing link.
  const existing = await db.storeInvite.findFirst({
    where: activeWhere(owner.storeId, now),
    orderBy: { createdAt: "desc" },
    select: { token: true },
  });
  if (existing) return toJoinLink(existing.token);

  const token = await db.$transaction(async (tx) => {
    await lockStore(tx, owner.storeId);
    // Re-check under the lock; another request may have just created one.
    const again = await tx.storeInvite.findFirst({
      where: activeWhere(owner.storeId, now),
      select: { token: true },
    });
    return again?.token ?? createInvite(tx, owner);
  });
  return toJoinLink(token);
}

/**
 * Rotate link (4.2 step 4): revokes every active link of the store, so old
 * QR codes, printed ones included, stop working, then creates a new one.
 */
export async function rotateJoinLink(owner: InviteOwner): Promise<JoinLink> {
  const token = await db.$transaction(async (tx) => {
    await lockStore(tx, owner.storeId);
    const now = new Date();
    await tx.storeInvite.updateMany({
      where: activeWhere(owner.storeId, now),
      data: { revokedAt: now },
    });
    return createInvite(tx, owner);
  });
  return toJoinLink(token);
}
