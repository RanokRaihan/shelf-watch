import "server-only";

import { cookies } from "next/headers";

import {
  DEVICE_COOKIE,
  PIN_LOCK_STEPS_MS,
  PIN_MAX_ATTEMPTS,
  SESSION_TTL_MS,
} from "@/lib/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { verifySecret } from "@/lib/passwords";
import { getSession, setAuthCookies } from "@/lib/session";
import { hashToken, newToken } from "@/lib/tokens";
import type { UnlockValues } from "@/lib/validations/unlock.validation";

function lockedMessage(until: Date, now: number): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now) / 60_000));
  return `Too many wrong PINs. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

// 1st lock 1 min, 2nd 5 min, 3rd and later 15 min.
function lockLength(failedAttempts: number): number {
  const step = Math.floor(failedAttempts / PIN_MAX_ATTEMPTS) - 1;
  return PIN_LOCK_STEPS_MS[Math.min(step, PIN_LOCK_STEPS_MS.length - 1)];
}

/**
 * PIN unlock (docs/auth-flow.md 4.4). The PIN only works on a trusted phone:
 * the `sw_device` cookie picks the user, so nobody types a username here.
 *
 * - Refused with FORBIDDEN if the device is missing, revoked or not approved,
 *   or its user isn't ACTIVE.
 * - Wrong PINs are counted on the server (`failedPinAttempts`). Every
 *   `PIN_MAX_ATTEMPTS` wrong tries set `lockedUntil`, growing 1, 5, 15 min.
 *   While locked, the PIN isn't even checked.
 * - A correct PIN resets the count and, in one transaction, replaces any old
 *   session on this phone with a new one (no manager access: that needs the
 *   password). Then sets `sw_session` and renews `sw_device`.
 *
 * Does nothing if this phone already has a valid session.
 */
export async function unlockWithPin({ pin }: UnlockValues): Promise<void> {
  if (await getSession()) return;

  const deviceToken = (await cookies()).get(DEVICE_COOKIE)?.value;
  const device = deviceToken
    ? await db.device.findUnique({
        where: { tokenHash: hashToken(deviceToken) },
        select: {
          id: true,
          approvedAt: true,
          revokedAt: true,
          user: {
            select: {
              id: true,
              status: true,
              pinHash: true,
              failedPinAttempts: true,
              lockedUntil: true,
            },
          },
        },
      })
    : null;

  if (
    !deviceToken ||
    !device ||
    device.revokedAt ||
    !device.approvedAt ||
    device.user.status !== "ACTIVE"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "This phone can't be unlocked right now. Ask your manager.",
    );
  }

  const { user } = device;
  const now = Date.now();

  if (user.lockedUntil && user.lockedUntil.getTime() > now) {
    const message = lockedMessage(user.lockedUntil, now);
    throw new AppError("FORBIDDEN", message, { pin: [message] });
  }

  if (!(await verifySecret(pin, user.pinHash))) {
    // Atomic increment, so parallel guesses each count.
    const { failedPinAttempts } = await db.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });

    if (failedPinAttempts % PIN_MAX_ATTEMPTS === 0) {
      const lockedUntil = new Date(now + lockLength(failedPinAttempts));
      await db.user.update({ where: { id: user.id }, data: { lockedUntil } });
      const message = lockedMessage(lockedUntil, now);
      throw new AppError("FORBIDDEN", message, { pin: [message] });
    }

    const left = PIN_MAX_ATTEMPTS - (failedPinAttempts % PIN_MAX_ATTEMPTS);
    const message = `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left.`;
    throw new AppError("UNAUTHENTICATED", message, { pin: [message] });
  }

  const sessionToken = newToken();
  const at = new Date(now);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { failedPinAttempts: 0, lockedUntil: null },
    }),
    // One session per phone: drop any ended or stale one first.
    db.session.deleteMany({ where: { deviceId: device.id } }),
    db.session.create({
      data: {
        id: hashToken(sessionToken),
        userId: user.id,
        deviceId: device.id,
        lastActiveAt: at,
        expiresAt: new Date(now + SESSION_TTL_MS),
      },
    }),
    db.device.update({ where: { id: device.id }, data: { lastSeenAt: at } }),
  ]);

  // Same device token, fresh 90-day max age ("renewed on use").
  await setAuthCookies({ deviceToken, sessionToken });
}
