import "server-only";

import type { Prisma, Role, UserStatus } from "@/app/generated/prisma/client";
import { IDLE_TIMEOUT_MS } from "@/lib/auth/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/core/errors";

/**
 * Store members for the manager's Members page: approve or reject join
 * requests (docs/auth-flow.md 4.3) and remove people (4.9).
 *
 * Callers pass the store and acting user from the session (`requireManager()`),
 * never from client input. Every lookup is scoped by `storeId`, so a user id
 * from another store behaves as if it doesn't exist.
 */
export type MemberActor = { storeId: string; userId: string; deviceId: string };

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

export type ActiveSession = {
  deviceId: string;
  deviceLabel: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  /** Manager access is current on this session (password in the last 15 min). */
  hasManagerAccess: boolean;
  /** The session the viewing manager is using right now. */
  isCurrent: boolean;
};

/**
 * A member's sessions that would still pass `getSession()` right now: not
 * expired, not idle, on an approved and unrevoked device, user ACTIVE. Ended
 * sessions are deleted lazily on their next request, so stale rows can still
 * exist and are filtered out here. Session ids (token hashes) never leave
 * this function; `currentSessionId` only marks the viewer's own session.
 */
export async function listActiveSessions(
  storeId: string,
  targetId: string,
  currentSessionId: string,
  now: Date = new Date(),
): Promise<ActiveSession[]> {
  const rows = await db.session.findMany({
    where: {
      userId: targetId,
      user: { storeId, status: "ACTIVE" },
      expiresAt: { gt: now },
      lastActiveAt: { gt: new Date(now.getTime() - IDLE_TIMEOUT_MS) },
      device: { approvedAt: { not: null }, revokedAt: null },
    },
    select: {
      id: true,
      createdAt: true,
      lastActiveAt: true,
      expiresAt: true,
      managerUntil: true,
      deviceId: true,
      device: { select: { label: true } },
    },
    orderBy: { lastActiveAt: "desc" },
  });
  return rows.map((row) => ({
    deviceId: row.deviceId,
    deviceLabel: row.device.label,
    createdAt: row.createdAt,
    lastActiveAt: row.lastActiveAt,
    expiresAt: row.expiresAt,
    hasManagerAccess: row.managerUntil !== null && row.managerUntil > now,
    isCurrent: row.id === currentSessionId,
  }));
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

type MemberDevice = { id: string; label: string | null; revokedAt: Date | null };

// Locks the member, then finds one of their phones. Shared guards for
// signing out a session and revoking a phone.
async function lockMemberDevice(
  tx: Tx,
  actor: MemberActor,
  targetId: string,
  deviceId: string,
): Promise<{ member: LockedMember; device: MemberDevice }> {
  if (deviceId === actor.deviceId) {
    throw new AppError("FORBIDDEN", "Use Log out to sign out of this phone.");
  }
  const member = await lockMember(tx, actor.storeId, targetId);
  if (member.status !== "ACTIVE") {
    throw new AppError("CONFLICT", "This person isn't an active member.");
  }
  const device = await tx.device.findFirst({
    where: { id: deviceId, userId: member.id, storeId: actor.storeId },
    select: { id: true, label: true, revokedAt: true },
  });
  if (!device) throw new AppError("NOT_FOUND", "We couldn't find that phone.");
  return { member, device };
}

/**
 * Sign a member out of one phone. A phone has at most one session (unlock
 * replaces it), so the device id names the session without exposing its id.
 * The phone stays trusted; they unlock with their PIN again.
 */
export async function endMemberSession(
  actor: MemberActor,
  targetId: string,
  deviceId: string,
): Promise<{ name: string; deviceLabel: string | null }> {
  return db.$transaction(async (tx) => {
    const { member, device } = await lockMemberDevice(tx, actor, targetId, deviceId);
    const { count } = await tx.session.deleteMany({
      where: { deviceId: device.id, userId: member.id },
    });
    if (count === 0) {
      throw new AppError("CONFLICT", "They're already signed out on that phone.");
    }
    return { name: member.name, deviceLabel: device.label };
  });
}

/**
 * Revoke a phone (4.10): `revokedAt` is set and its sessions are deleted in
 * the same transaction, so it stops working on its next request.
 */
export async function revokeMemberDevice(
  actor: MemberActor,
  targetId: string,
  deviceId: string,
): Promise<{ name: string; deviceLabel: string | null }> {
  return db.$transaction(async (tx) => {
    const { member, device } = await lockMemberDevice(tx, actor, targetId, deviceId);
    if (device.revokedAt) {
      throw new AppError("CONFLICT", "That phone was already revoked.");
    }
    await tx.device.update({ where: { id: device.id }, data: { revokedAt: new Date() } });
    await tx.session.deleteMany({ where: { deviceId: device.id } });
    return { name: member.name, deviceLabel: device.label };
  });
}
