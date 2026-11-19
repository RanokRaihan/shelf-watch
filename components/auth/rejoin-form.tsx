"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { rejoinAction } from "@/actions/join.action";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { toFormErrors } from "@/lib/core/action-result";
import {
  rejoinSchema,
  type RejoinValues,
} from "@/lib/validations/join.validation";
import { PIN_LENGTH } from "@/lib/validations/register.validation";

// Existing member on a phone with no device token (docs/auth-flow.md 4.7).
export function RejoinForm({ token }: { token: string }) {
  const router = useRouter();

  const defaultValues: RejoinValues = { token, username: "", pin: "" };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: rejoinSchema,
      onSubmitAsync: async ({ value, formApi }) => {
        const result = await rejoinAction(value);
        if (result.ok) {
          toast.success("You're in. Your other phones were logged out.");
          router.replace("/pulls");
          return undefined;
        }
        // Link rotated, or this phone is already set up: let the page guard handle it.
        if (result.error.code === "NOT_FOUND" || result.error.code === "FORBIDDEN") {
          toast.error(result.error.message);
          router.refresh();
          return undefined;
        }
        formApi.setFieldValue("pin", "", { dontValidate: true });
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
            <form.Field name="username">
              {(field) => (
                <TextField
                  field={field}
                  label="Username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}
            </form.Field>
            <form.Field name="pin">
              {(field) => (
                <TextField
                  field={field}
                  label="PIN"
                  type="password"
                  revealable
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  maxLength={PIN_LENGTH}
                />
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
              {isSubmitting ? "Logging in…" : "Log in"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
