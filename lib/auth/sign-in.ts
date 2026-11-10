import "server-only";

import { MANAGER_TTL_MS, SESSION_TTL_MS } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { afterFailedAttempt } from "@/lib/lockout";
import { hashSecret, verifySecret } from "@/lib/passwords";
import { assertGuest, setAuthCookies } from "@/lib/session";
import { hashToken, newToken } from "@/lib/tokens";
import type { SignInValues } from "@/lib/validations/sign-in.validation";

const WRONG = "Wrong username or password.";

// Checked when there's no real hash, so every failure takes about as long.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashSecret("shelfwatch-dummy-password");
  return dummyHash;
}

// Password sign-in on a new browser (docs/auth-flow.md 4.12); every failure throws the same error.
export async function signInWithPassword({
  identifier,
  password,
}: SignInValues): Promise<void> {
  await assertGuest();

  const user = await db.user.findUnique({
    where: identifier.includes("@") ? { email: identifier } : { username: identifier },
    select: {
      id: true,
      storeId: true,
      status: true,
      passwordHash: true,
      passwordLockedUntil: true,
    },
  });

  const now = Date.now();
  const locked = !!user?.passwordLockedUntil && user.passwordLockedUntil.getTime() > now;

  if (!user || !user.passwordHash || user.status !== "ACTIVE" || locked) {
    await verifySecret(password, await getDummyHash());
    throw new AppError("UNAUTHENTICATED", WRONG);
  }

  if (!(await verifySecret(password, user.passwordHash))) {
    // Atomic increment, so parallel guesses each count.
    const { failedPasswordAttempts } = await db.user.update({
      where: { id: user.id },
      data: { failedPasswordAttempts: { increment: 1 } },
      select: { failedPasswordAttempts: true },
    });
    const { lockedUntil } = afterFailedAttempt(failedPasswordAttempts, now, "password");
    if (lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: { passwordLockedUntil: lockedUntil },
      });
    }
    throw new AppError("UNAUTHENTICATED", WRONG);
  }

  const deviceToken = newToken();
  const sessionToken = newToken();
  const at = new Date(now);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { failedPasswordAttempts: 0, passwordLockedUntil: null },
    });
    const device = await tx.device.create({
      data: {
        storeId: user.storeId,
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
        managerUntil: new Date(now + MANAGER_TTL_MS),
      },
    });
  });

  await setAuthCookies({ deviceToken, sessionToken });
}
