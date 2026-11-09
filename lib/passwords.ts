import "server-only";

import bcrypt from "bcryptjs";

// bcrypt cost factor. 12 is about 250ms per hash on a modern server.
const COST = 12;

/** Hashes a password or PIN for storage. */
export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** Checks a password or PIN against a stored hash. */
export function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
