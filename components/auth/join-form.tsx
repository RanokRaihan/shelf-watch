"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { joinAction } from "@/actions/join.action";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { toFormErrors } from "@/lib/core/action-result";
import {
  joinSchema,
  type JoinValues,
} from "@/lib/validations/join.validation";
import { PIN_LENGTH } from "@/lib/validations/register.validation";

// Shared props for the PIN fields: masked, digits keypad on iOS and Android.
const pinInputProps = {
  type: "password",
  revealable: true,
  inputMode: "numeric",
  pattern: "[0-9]*",
  autoComplete: "off",
  maxLength: PIN_LENGTH,
} as const;

/**
 * Join form (docs/auth-flow.md 4.3), one column for one-handed use. The
 * token comes from the URL; the server finds the store from it.
 */
export function JoinForm({ token }: { token: string }) {
  const router = useRouter();

  const defaultValues: JoinValues = {
    token,
    name: "",
    username: "",
    phone: "",
    pin: "",
    confirmPin: "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: joinSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await joinAction(value);
        if (result.ok) {
          router.replace("/pending");
          return undefined;
        }
        // Link rotated, or this phone is already set up: re-render the page
        // so its guard shows the invalid-link message or redirects.
        if (result.error.code === "NOT_FOUND" || result.error.code === "FORBIDDEN") {
          toast.error(result.error.message);
          router.refresh();
          return undefined;
        }
        return toFormErrors(result);
      },
    },
  });

  return (
    <form
      // POST, so a submit before hydration never puts secrets in the URL.
      method="post"
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <form.Field name="name">
              {(field) => (
                <TextField
                  field={field}
                  label="Display name"
                  description="What your team will see."
                  autoComplete="name"
                  autoCapitalize="words"
                />
              )}
            </form.Field>
            <form.Field name="username">
              {(field) => (
                <TextField
                  field={field}
                  label="Username"
                  description="Letters, numbers, dots and underscores. Saved in lowercase."
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}
            </form.Field>
            <form.Field name="phone">
              {(field) => (
                <TextField
                  field={field}
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(215) 555-1234"
                />
              )}
            </form.Field>
            <form.Field name="pin">
              {(field) => (
                <TextField
                  field={field}
                  label="PIN"
                  description={`${PIN_LENGTH} digits. You'll use it to open the app.`}
                  {...pinInputProps}
                />
              )}
            </form.Field>
            <form.Field
              name="confirmPin"
              validators={{
                // Like the register form: check on blur, and again when PIN is
                // blurred. Empty is left to the submit check.
                onBlurListenTo: ["pin"],
                onBlur: ({ value, fieldApi }) =>
                  value && value !== fieldApi.form.getFieldValue("pin")
                    ? "PINs don't match"
                    : undefined,
              }}
            >
              {(field) => (
                <TextField field={field} label="Confirm PIN" {...pinInputProps} />
              )}
            </form.Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <form.Subscribe
        selector={(state) => ({
          formError: state.errorMap.onSubmit,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ formError, isSubmitting }) => (
          <div className="flex flex-col gap-3">
            {typeof formError === "string" && (
              <FieldError className="text-base">{formError}</FieldError>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full text-base"
            >
              {isSubmitting ? "Sending request…" : "Request to join"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
