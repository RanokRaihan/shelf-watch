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
import { AppError } from "@/lib/errors";
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

const deviceInclude = {
  user: { select: { name: true, username: true, status: true } },
  store: { select: { name: true } },
} as const;

type DeviceOwner = {
  user: { name: string; username: string };
  store: { name: string };
};

export type DeviceState =
  | { state: "none" }
  | { state: "revoked" }
  | ({ state: "pending" } & DeviceOwner)
  | ({ state: "trusted" } & DeviceOwner);

/**
 * What the `sw_device` cookie says about this phone. Read only: doesn't set
 * cookies or touch `lastSeenAt`, so it works in Server Components.
 * - `none`: no cookie, or no matching device
 * - `revoked`: device revoked, or its user is disabled
 * - `pending`: device or user still waiting for manager approval
 * - `trusted`: approved device of an ACTIVE user, ready for the PIN screen
 */
export async function getDevice(): Promise<DeviceState> {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return { state: "none" };

  const device = await db.device.findUnique({
    where: { tokenHash: hashToken(token) },
    include: deviceInclude,
  });
  if (!device) return { state: "none" };

  const { user, store } = device;
  if (device.revokedAt || user.status === "DISABLED") return { state: "revoked" };

  const owner = { user: { name: user.name, username: user.username }, store };
  if (!device.approvedAt || user.status === "PENDING") {
    return { state: "pending", ...owner };
  }
  return { state: "trusted", ...owner };
}

/**
 * Where `/` should send this visitor: `/today` with a valid session,
 * `/unlock` for a trusted or pending device, or null to show the landing page.
 */
export async function getEntryRoute(): Promise<"/today" | "/unlock" | null> {
  if (await getSession()) return "/today";
  const device = await getDevice();
  if (device.state === "pending" || device.state === "trusted") return "/unlock";
  return null;
}

/**
 * Guard for guest-only pages (`/register`, later `/signin` and `/join`).
 * Sends a signed-in phone to `/today` and a trusted or pending device to
 * `/unlock`. Call it in the page's Suspense child, before rendering content.
 */
export async function requireGuest(): Promise<void> {
  const route = await getEntryRoute();
  if (route) redirect(route);
}

/**
 * Same rule as `requireGuest`, for mutations: throws a FORBIDDEN `AppError`
 * instead of redirecting, so the form shows the message. Server actions can be
 * called without the page, so guest-only mutations must call this themselves.
 */
export async function assertGuest(): Promise<void> {
  const route = await getEntryRoute();
  if (route === "/today") {
    throw new AppError("FORBIDDEN", "You're already signed in.");
  }
  if (route === "/unlock") {
    throw new AppError(
      "FORBIDDEN",
      "This phone is already set up for a store. Unlock it with your PIN.",
    );
  }
}
