import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ACTIVE_TOUCH_MS,
  DEVICE_COOKIE,
  DEVICE_TTL_MS,
  IDLE_TIMEOUT_MS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "@/lib/auth-config";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // Secure only in production, so testing on a phone over LAN http still works.
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * Sets `sw_device` and `sw_session`. Only works in a server action or route
 * handler; Server Components can't set cookies.
 */
export async function setAuthCookies(tokens: {
  deviceToken: string;
  sessionToken: string;
}): Promise<void> {
  const jar = await cookies();
  jar.set(DEVICE_COOKIE, tokens.deviceToken, {
    ...baseCookie,
    maxAge: DEVICE_TTL_MS / 1000,
  });
  jar.set(SESSION_COOKIE, tokens.sessionToken, {
    ...baseCookie,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

const sessionInclude = {
  user: {
    select: {
      id: true,
      storeId: true,
      name: true,
      username: true,
      role: true,
      status: true,
      store: { select: { id: true, name: true, timezone: true } },
    },
  },
  device: {
    select: { id: true, storeId: true, approvedAt: true, revokedAt: true },
  },
} as const;

async function loadSession(id: string) {
  return db.session.findUnique({ where: { id }, include: sessionInclude });
}

type LoadedSession = NonNullable<Awaited<ReturnType<typeof loadSession>>>;

export type AuthContext = {
  user: LoadedSession["user"];
  device: LoadedSession["device"];
  session: Omit<LoadedSession, "user" | "device">;
};

/**
 * The per-request check from docs/auth-flow.md section 3. Returns the user,
 * device and session, or null if there is no valid session. Role and status
 * come from the database on every call. Doesn't touch cookies, so it works in
 * Server Components too.
 */
export async function getSession(): Promise<AuthContext | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await loadSession(hashToken(token));
  if (!row) return null;

  const now = Date.now();
  const { user, device, ...session } = row;

  const expired = session.expiresAt.getTime() <= now;
  const idle = now - session.lastActiveAt.getTime() > IDLE_TIMEOUT_MS;
  if (expired || idle) {
    // An ended session is deleted, not just marked. deleteMany so a
    // concurrent request that already deleted it doesn't throw.
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  if (device.revokedAt || !device.approvedAt) return null;
  if (user.status !== "ACTIVE") return null;

  if (now - session.lastActiveAt.getTime() > ACTIVE_TOUCH_MS) {
    const at = new Date(now);
    await db.$transaction([
      db.session.update({ where: { id: session.id }, data: { lastActiveAt: at } }),
      db.device.update({ where: { id: device.id }, data: { lastSeenAt: at } }),
    ]);
    session.lastActiveAt = at;
  }

  return { user, device, session };
}

/** Like `getSession`, but sends the user to `/unlock` when there is none. */
export async function requireSession(): Promise<AuthContext> {
  const auth = await getSession();
  if (!auth) redirect("/unlock");
  return auth;
}
