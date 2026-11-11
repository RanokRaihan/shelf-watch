import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { fail, type ActionFailure, type ErrorCode, type FieldErrors } from "@/lib/core/action-result";

/**
 * Expected business errors. Throw these from `lib/` functions; `createAction`
 * turns them into an `ActionFailure`, and `message` is shown to the user.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldErrors;

  constructor(code: ErrorCode, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// Prisma's default unique index name is `<Model>_<field>[_<field>…]_key`,
// e.g. `User_username_key` -> ["username"]. Model and field names here
// contain no underscores, so splitting on "_" is safe.
function fieldsFromIndexName(index: string): string[] {
  const parts = index.split("_");
  if (parts.length < 3 || parts.at(-1) !== "key") return [];
  return parts.slice(1, -1);
}

// Fields of a violated unique constraint. Without a driver adapter Prisma puts
// them in `meta.target`. With `@prisma/adapter-pg`, Postgres reports the
// constraint by name, so the adapter gives
// `meta.driverAdapterError.cause.constraint.index` (e.g. "User_username_key")
// and only falls back to `.fields` when there is no name. Check all three.
function uniqueFields(meta: Record<string, unknown> | undefined): string[] {
  if (!meta) return [];
  if (Array.isArray(meta.target)) return meta.target.map(String);

  const constraint = (
    meta.driverAdapterError as
      | { cause?: { constraint?: { fields?: unknown; index?: unknown } } }
      | undefined
  )?.cause?.constraint;
  if (Array.isArray(constraint?.fields)) return constraint.fields.map(String);
  if (typeof constraint?.index === "string") {
    return fieldsFromIndexName(constraint.index);
  }
  return [];
}

/** Maps known Prisma errors to a failure, or returns null for anything else. */
export function mapPrismaError(err: unknown): ActionFailure | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

  switch (err.code) {
    case "P2002": {
      const message = "This already exists.";
      const fields = uniqueFields(err.meta);
      const fieldErrors = Object.fromEntries(
        fields.map((field) => [field, [`This ${field} is already taken`]]),
      );
      return fail("CONFLICT", message, fields.length ? fieldErrors : undefined);
    }
    case "P2025":
      return fail("NOT_FOUND", "We couldn't find that record.");
    case "P2003":
      return fail("CONFLICT", "This is linked to a record that doesn't exist.");
    default:
      return null;
  }
}
