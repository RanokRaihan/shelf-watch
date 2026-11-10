import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { fail, isActionResult, ok, type ActionResult } from "@/lib/core/action-result";
import { AppError, mapPrismaError } from "@/lib/core/errors";

// No "use server" here: such a file may only export async functions. The
// action files that call createAction have "use server".

// A handler returns plain data (wrapped in `ok`) or a ready ActionResult,
// for example `ok(data, "Saved")` for a custom success message.
type HandlerReturn<T> = T | ActionResult<T>;

function handleError(err: unknown): ActionResult<never> {
  // redirect() and notFound() work by throwing; let Next handle them.
  unstable_rethrow(err);

  if (err instanceof AppError) return fail(err.code, err.message, err.fieldErrors);

  const prismaFailure = mapPrismaError(err);
  if (prismaFailure) return prismaFailure;

  // Unexpected: log everything on the server, send nothing internal to the client.
  console.error("[action] unexpected error", err);
  return fail("INTERNAL", "Something went wrong. Try again.");
}

async function run<T>(
  fn: () => Promise<HandlerReturn<T>>,
): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    return isActionResult(result) ? (result as ActionResult<T>) : ok(result as T);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Wraps a server action: validates input with the Zod schema, runs the
 * handler, and returns an ActionResult. Business errors are thrown from
 * `lib/` as `AppError`.
 *
 * @example
 * export const registerAction = createAction(registerSchema, (values) => registerManager(values));
 */
export function createAction<T>(
  handler: () => Promise<HandlerReturn<T>>,
): () => Promise<ActionResult<T>>;
export function createAction<S extends z.ZodType, T>(
  schema: S,
  handler: (input: z.output<S>) => Promise<HandlerReturn<T>>,
): (input: z.input<S>) => Promise<ActionResult<T>>;
export function createAction<S extends z.ZodType, T>(
  schemaOrHandler: S | (() => Promise<HandlerReturn<T>>),
  maybeHandler?: (input: z.output<S>) => Promise<HandlerReturn<T>>,
) {
  if (typeof schemaOrHandler === "function") {
    const handler = schemaOrHandler;
    return async () => run(handler);
  }

  const schema = schemaOrHandler;
  const handler = maybeHandler!;
  return async (input: z.input<S>): Promise<ActionResult<T>> => {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "VALIDATION",
        "Check the highlighted fields.",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    return run(() => handler(parsed.data));
  };
}
