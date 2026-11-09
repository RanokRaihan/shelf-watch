import "server-only";

import type { Prisma, Role, UserStatus } from "@/app/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

/**
 * Store members for the manager's Members page: approve or reject join
 * requests (docs/auth-flow.md 4.3) and remove people (4.9).
 *
 * Callers pass the store and acting user from the session (`requireManager()`),
 * never from client input. Every lookup is scoped by `storeId`, so a user id
 * from another store behaves as if it doesn't exist.
 */
export type MemberActor = { storeId: string; userId: string };

type Tx = Prisma.TransactionClient;

const memberSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  status: true,
  createdAt: true,
  approvedAt: true,
} as const;

export type MemberSummary = Prisma.UserGetPayload<{ select: typeof memberSelect }>;

export type MemberGroups = {
  pending: MemberSummary[];
  active: MemberSummary[];
  removed: MemberSummary[];
};

/** Everyone in the store, grouped by status and sorted by name. */
export async function listMembers(storeId: string): Promise<MemberGroups> {
  const users = await db.user.findMany({
    where: { storeId },
    select: memberSelect,
    orderBy: [{ name: "asc" }, { username: "asc" }],
  });
  return {
    pending: users.filter((u) => u.status === "PENDING"),
    active: users.filter((u) => u.status === "ACTIVE"),
    removed: users.filter((u) => u.status === "DISABLED"),
  };
}

/** How many join requests are waiting, for the Members tab badge. */
export async function countPendingMembers(storeId: string): Promise<number> {
  return db.user.count({ where: { storeId, status: "PENDING" } });
}

const memberDetailSelect = {
  ...memberSelect,
  phone: true,
  email: true,
  devices: {
    select: {
      id: true,
      label: true,
      createdAt: true,
      lastSeenAt: true,
      approvedAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} as const;

export type MemberDetail = Prisma.UserGetPayload<{ select: typeof memberDetailSelect }>;

/** One member of the store with contact details and devices, or null. */
export async function getMember(
  storeId: string,
  targetId: string,
): Promise<MemberDetail | null> {
  return db.user.findFirst({
    where: { id: targetId, storeId },
    select: memberDetailSelect,
  });
}

/** Which actions the acting manager may take on a member. */
export function memberActionKind(
  actorId: string,
  member: { id: string; role: Role; status: UserStatus },
): "pending" | "active" | null {
  if (member.id === actorId) return null;
  if (member.status === "PENDING") return "pending";
  if (member.status === "ACTIVE" && member.role !== "MANAGER") return "active";
  return null;
}

type LockedMember = { id: string; name: string; role: Role; status: UserStatus };

// Locks the target's row for the rest of the transaction, so an Approve and a
// Reject (or two managers) on the same person can't both go through.
async function lockMember(
  tx: Tx,
  storeId: string,
  targetId: string,
): Promise<LockedMember> {
  const rows = await tx.$queryRaw<LockedMember[]>`
    SELECT id, name, role, status FROM "User"
    WHERE id = ${targetId} AND "storeId" = ${storeId}
    FOR UPDATE`;
  const member = rows[0];
  if (!member) throw new AppError("NOT_FOUND", "We couldn't find that person.");
  return member;
}

function assertPending(member: LockedMember): void {
  if (member.status !== "PENDING") {
    throw new AppError("CONFLICT", "This request was already handled.");
  }
}

/**
 * Approve a join request (4.3 step 6): the user becomes ACTIVE and their
 * waiting devices are approved, so their phone shows the PIN screen next.
 */
export async function approveMember(
  actor: MemberActor,
  targetId: string,
): Promise<{ name: string }> {
  return db.$transaction(async (tx) => {
    const member = await lockMember(tx, actor.storeId, targetId);
    assertPending(member);
    const now = new Date();
    await tx.user.update({
      where: { id: member.id },
      data: { status: "ACTIVE", approvedAt: now },
    });
    await tx.device.updateMany({
      where: { userId: member.id, approvedAt: null, revokedAt: null },
      data: { approvedAt: now },
    });
    return { name: member.name };
  });
}

/**
 * Reject a join request: deletes the pending user and their devices, which
 * frees the username and phone. Their phone falls back to "Scan your store's
 * QR code". A pending user owns nothing else (no sessions, pulls or invites).
 */
export async function rejectMember(
  actor: MemberActor,
  targetId: string,
): Promise<{ name: string }> {
  return db.$transaction(async (tx) => {
    const member = await lockMember(tx, actor.storeId, targetId);
    assertPending(member);
    await tx.session.deleteMany({ where: { userId: member.id } });
    await tx.device.deleteMany({ where: { userId: member.id } });
    await tx.user.delete({ where: { id: member.id } });
    return { name: member.name };
  });
}

/**
 * Remove a person (4.9): DISABLED, and in the same transaction every session
 * is deleted and every device revoked, so they're out on their next request.
 * Not allowed on yourself or on another manager.
 */
export async function removeMember(
  actor: MemberActor,
  targetId: string,
): Promise<{ name: string }> {
  if (targetId === actor.userId) {
    throw new AppError("FORBIDDEN", "You can't remove yourself.");
  }
  return db.$transaction(async (tx) => {
    const member = await lockMember(tx, actor.storeId, targetId);
    if (member.role === "MANAGER") {
      throw new AppError("FORBIDDEN", "Managers can't be removed here.");
    }
    if (member.status !== "ACTIVE") {
      throw new AppError("CONFLICT", "This person isn't an active member.");
    }
    const now = new Date();
    await tx.user.update({ where: { id: member.id }, data: { status: "DISABLED" } });
    await tx.session.deleteMany({ where: { userId: member.id } });
    await tx.device.updateMany({
      where: { userId: member.id, revokedAt: null },
      data: { revokedAt: now },
    });
    return { name: member.name };
  });
}
