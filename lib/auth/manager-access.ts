import "server-only";

import { MANAGER_TTL_MS, MAX_FAILED_ATTEMPTS } from "@/lib/auth/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/core/errors";
import { verifySecret } from "@/lib/auth/passwords";
import { endSession, getSession, hasManagerAccess } from "@/lib/auth/session";
import type { ManagerLoginValues } from "@/lib/validations/manager-login.validation";

// Manager access (docs/auth-flow.md 4.5 and 5): wrong passwords count on this session, and the 5th ends it.
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
    select: { passwordHash: true },
  });
  // Members join without a password; a promoted user must add one (4.11).
  if (!user.passwordHash) {
    throw new AppError("FORBIDDEN", "Add a password to your account first.");
  }

  if (!(await verifySecret(password, user.passwordHash))) {
    // Atomic increment, so parallel guesses each count.
    const { failedPasswordAttempts } = await db.session.update({
      where: { id: auth.session.id },
      data: { failedPasswordAttempts: { increment: 1 } },
      select: { failedPasswordAttempts: true },
    });
    if (failedPasswordAttempts >= MAX_FAILED_ATTEMPTS) {
      await endSession();
      // No field error, so the form toasts and refreshes to /unlock.
      throw new AppError(
        "UNAUTHENTICATED",
        "Too many wrong passwords. Unlock with your PIN again.",
      );
    }
    const left = MAX_FAILED_ATTEMPTS - failedPasswordAttempts;
    const message = `Wrong password. ${left} ${left === 1 ? "try" : "tries"} left.`;
    throw new AppError("UNAUTHENTICATED", message, { password: [message] });
  }

  await db.session.update({
    where: { id: auth.session.id },
    data: {
      failedPasswordAttempts: 0,
      managerUntil: new Date(Date.now() + MANAGER_TTL_MS),
    },
  });
}

/**
 * Ends manager access on this session (the Lock button): clears
 * `managerUntil`, so manager pages need the password again. The session and
 * device stay, and no cookies change. Does nothing without a session.
 */
export async function lockManagerAccess(): Promise<void> {
  const auth = await getSession();
  if (!auth) return;
  await db.session.update({
    where: { id: auth.session.id },
    data: { managerUntil: null },
  });
}
