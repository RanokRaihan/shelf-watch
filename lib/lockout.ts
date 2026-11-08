import "server-only";

import { LOCK_STEPS_MS, MAX_FAILED_ATTEMPTS } from "@/lib/auth-config";
import type { ErrorCode } from "@/lib/action-result";

// Brute force protection shared by PIN and password (docs/auth-flow.md 5).
// The failed count keeps going through each lock and resets only on success,
// so `count / MAX_FAILED_ATTEMPTS` says which lock this is.

type Secret = "PIN" | "password";

/** "Too many wrong PINs. Try again in 3 minutes." */
export function lockedMessage(until: Date, now: number, secret: Secret): string {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now) / 60_000));
  return `Too many wrong ${secret}s. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

// 1st lock 1 min, 2nd 5 min, 3rd and later 15 min.
function lockLength(failedAttempts: number): number {
  const step = Math.floor(failedAttempts / MAX_FAILED_ATTEMPTS) - 1;
  return LOCK_STEPS_MS[Math.min(step, LOCK_STEPS_MS.length - 1)];
}

/**
 * What a wrong try means, given the count after incrementing it: every
 * `MAX_FAILED_ATTEMPTS`th one returns a `lockedUntil` to save; the others say
 * how many tries are left. The caller saves the lock and throws the message.
 */
export function afterFailedAttempt(
  failedAttempts: number,
  now: number,
  secret: Secret,
): { code: ErrorCode; message: string; lockedUntil?: Date } {
  if (failedAttempts % MAX_FAILED_ATTEMPTS === 0) {
    const lockedUntil = new Date(now + lockLength(failedAttempts));
    return { code: "FORBIDDEN", message: lockedMessage(lockedUntil, now, secret), lockedUntil };
  }
  const left = MAX_FAILED_ATTEMPTS - (failedAttempts % MAX_FAILED_ATTEMPTS);
  return {
    code: "UNAUTHENTICATED",
    message: `Wrong ${secret}. ${left} ${left === 1 ? "try" : "tries"} left.`,
  };
}
