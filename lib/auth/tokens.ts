import "server-only";

import { createHash, randomBytes } from "node:crypto";

/** A new random token for a cookie or link: 32 bytes, base64url. */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * sha256 of a token, as hex. Device and session tokens are stored only as
 * this hash. Store join link tokens are the exception: they're public by
 * design and stored as plain text (docs/auth-flow.md 5). A fast hash is fine
 * because the tokens are long and random.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
