// The one response shape every server action returns. Safe to import on the
// client and the server (no server-only code here).

export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  // Reserved for when auth is in scope.
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INTERNAL";

export type FieldErrors = Partial<Record<string, string[]>>;

export type ActionSuccess<T> = { ok: true; data: T; message?: string };

export type ActionFailure = {
  ok: false;
  error: { code: ErrorCode; message: string; fieldErrors?: FieldErrors };
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export function ok<T>(data: T, message?: string): ActionSuccess<T> {
  return message === undefined ? { ok: true, data } : { ok: true, data, message };
}

export function fail(
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): ActionFailure {
  return fieldErrors === undefined
    ? { ok: false, error: { code, message } }
    : { ok: false, error: { code, message, fieldErrors } };
}

export function isActionResult(value: unknown): value is ActionResult<unknown> {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return false;
  }
  return value.ok === true ? "data" in value : value.ok === false && "error" in value;
}

/**
 * Converts a failure into the shape TanStack Form's `validators.onSubmitAsync`
 * accepts, so server errors show in the form's existing `FieldError` UI.
 * The form-level message is only set when no field explains the error.
 */
export function toFormErrors(failure: ActionFailure): {
  form?: string;
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {};
  for (const [name, messages] of Object.entries(failure.error.fieldErrors ?? {})) {
    if (messages?.[0]) fields[name] = messages[0];
  }
  return Object.keys(fields).length > 0
    ? { fields }
    : { form: failure.error.message, fields };
}
