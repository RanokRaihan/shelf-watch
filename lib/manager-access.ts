import "server-only";

import { MANAGER_TTL_MS } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { afterFailedAttempt, lockedMessage } from "@/lib/lockout";
import { verifySecret } from "@/lib/passwords";
import { getSession, hasManagerAccess } from "@/lib/session";
import type { ManagerLoginValues } from "@/lib/validations/manager-login.validation";

/**
 * Manager access (docs/auth-flow.md 4.5). The manager is already signed in
 * with their PIN; a correct password sets `managerUntil` on this session to
 * now + 15 minutes. No new cookies: access lives on the session row, so
 * locking or logging out ends it too.
 *
 * Wrong passwords count in `failedPasswordAttempts`; every 5th sets
 * `passwordLockedUntil` (1, 5, then 15 min). While locked the password isn't
 * checked. Does nothing if the manager already has access.
 */
export async function confirmManagerPassword({
  password,
}: ManagerLoginValues): Promise<void> {
  const auth = await getSession();
  if (!auth) throw new AppError("UNAUTHENTICATED", "Unlock with your PIN first.");
  if (auth.user.role !== "MANAGER") {
    throw new AppError("FORBIDDEN", "This is for store managers.");
  }
  if (hasManagerAccess(auth)) return;

  const user = await db.user.findUniqueOrThrow({
    where: { id: auth.user.id },
    select: { passwordHash: true, passwordLockedUntil: true },
  });
  // Members join without a password; a promoted user must add one (4.11).
  if (!user.passwordHash) {
    throw new AppError("FORBIDDEN", "Add a password to your account first.");
  }

  const now = Date.now();
  if (user.passwordLockedUntil && user.passwordLockedUntil.getTime() > now) {
    const message = lockedMessage(user.passwordLockedUntil, now, "password");
    throw new AppError("FORBIDDEN", message, { password: [message] });
  }

  if (!(await verifySecret(password, user.passwordHash))) {
    // Atomic increment, so parallel guesses each count.
    const { failedPasswordAttempts } = await db.user.update({
      where: { id: auth.user.id },
      data: { failedPasswordAttempts: { increment: 1 } },
      select: { failedPasswordAttempts: true },
    });
    const failure = afterFailedAttempt(failedPasswordAttempts, now, "password");
    if (failure.lockedUntil) {
      await db.user.update({
        where: { id: auth.user.id },
        data: { passwordLockedUntil: failure.lockedUntil },
      });
    }
    throw new AppError(failure.code, failure.message, {
      password: [failure.message],
    });
  }

  await db.$transaction([
    db.user.update({
      where: { id: auth.user.id },
      data: { failedPasswordAttempts: 0, passwordLockedUntil: null },
    }),
    db.session.update({
      where: { id: auth.session.id },
      data: { managerUntil: new Date(now + MANAGER_TTL_MS) },
    }),
  ]);
}
