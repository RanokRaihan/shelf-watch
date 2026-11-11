"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { cn } from "cn";
import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Shared TanStack Form text field for the auth forms (register, join):
// label, 48px input, optional eye button, description and errors.

export const CONTROL_SIZE = "h-12 px-3 text-base md:text-base";

export function isFieldInvalid(field: AnyFieldApi) {
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

// Zod errors arrive as `{ message }`, server errors as plain strings.
export function toFieldErrors(errors: unknown[]) {
  return errors.map((error) =>
    typeof error === "string" ? { message: error } : (error as { message?: string }),
  );
}

export type TextFieldProps = ComponentProps<"input"> & {
  field: AnyFieldApi;
  label: string;
  description?: string;
  fieldClassName?: string;
  /** Adds an eye button that shows or hides the value (for `type="password"`). */
  revealable?: boolean;
};

export function TextField({
  field,
  label,
  description,
  fieldClassName,
  revealable = false,
  type,
  ...props
}: TextFieldProps) {
  const isInvalid = isFieldInvalid(field);
  const [isRevealed, setIsRevealed] = useState(false);

  const input = (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      aria-invalid={isInvalid}
      className={cn(CONTROL_SIZE, revealable && "pr-12")}
      type={revealable && isRevealed ? "text" : type}
      {...props}
    />
  );

  return (
    <Field data-invalid={isInvalid} className={fieldClassName}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {revealable ? (
        <div className="relative">
          {input}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsRevealed((revealed) => !revealed)}
            aria-label={`${isRevealed ? "Hide" : "Show"} ${label.toLowerCase()}`}
            aria-pressed={isRevealed}
            aria-controls={field.name}
            className="absolute inset-y-0 right-0 h-12 w-12 text-muted-foreground"
          >
            {isRevealed ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
      ) : (
        input
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={toFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}
