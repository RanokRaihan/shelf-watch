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
