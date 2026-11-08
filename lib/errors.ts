import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { fail, type ActionFailure, type ErrorCode, type FieldErrors } from "@/lib/action-result";

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

// Fields of a violated unique constraint. Prisma puts them in `meta.target`;
// with a driver adapter (`@prisma/adapter-pg`) they may be under
// `meta.driverAdapterError.cause.constraint.fields` instead, so check both.
function uniqueFields(meta: Record<string, unknown> | undefined): string[] {
  if (!meta) return [];
  if (Array.isArray(meta.target)) return meta.target.map(String);

  const fields = (
    meta.driverAdapterError as
      | { cause?: { constraint?: { fields?: unknown } } }
      | undefined
  )?.cause?.constraint?.fields;
  return Array.isArray(fields) ? fields.map(String) : [];
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
