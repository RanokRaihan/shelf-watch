import "server-only";

// Names and lifetimes from docs/auth-flow.md.

export const DEVICE_COOKIE = "sw_device";
export const SESSION_COOKIE = "sw_session";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Device token lifetime, renewed on use. */
export const DEVICE_TTL_MS = 90 * DAY;
/** Absolute session limit, about one shift. */
export const SESSION_TTL_MS = 10 * HOUR;
/** A session ends after this long without activity. */
export const IDLE_TIMEOUT_MS = 30 * MINUTE;
/** `lastActiveAt` is only rewritten when older than this. */
export const ACTIVE_TOUCH_MS = 1 * MINUTE;
/** Manager access after a correct password. */
export const MANAGER_TTL_MS = 15 * MINUTE;

/**
 * Wrong PINs (or passwords) in a row before the user is locked
 * (docs/auth-flow.md 5).
 */
export const MAX_FAILED_ATTEMPTS = 5;
/**
 * Lock length for the 1st, 2nd and 3rd+ lock in a row: about 1, 5, then 15
 * minutes. The step comes from `failed attempts / MAX_FAILED_ATTEMPTS`, since
 * the count only resets on a correct PIN or password.
 */
export const LOCK_STEPS_MS = [1 * MINUTE, 5 * MINUTE, 15 * MINUTE] as const;
