"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signInAction } from "@/actions/sign-in.action";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { toFormErrors } from "@/lib/core/action-result";
import {
  signInSchema,
  type SignInValues,
} from "@/lib/validations/sign-in.validation";

// Password sign-in (docs/auth-flow.md 4.12). On success the action redirects to /today.
export function SignInForm() {
  const router = useRouter();

  const defaultValues: SignInValues = { identifier: "", password: "" };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: signInSchema,
      onSubmitAsync: async ({ value, formApi }) => {
        const result = await signInAction(value);
        if (result.ok) return undefined;
        // This browser got a session or device meanwhile: let the page guard redirect.
        if (result.error.code === "FORBIDDEN") {
          toast.error(result.error.message);
          router.refresh();
          return undefined;
        }
        formApi.setFieldValue("password", "", { dontValidate: true });
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
            <form.Field name="identifier">
              {(field) => (
                <TextField
                  field={field}
                  label="Username or email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <TextField
                  field={field}
                  label="Password"
                  type="password"
                  revealable
                  autoComplete="current-password"
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
              <FieldError role="alert" className="text-base">
                {formError}
              </FieldError>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full text-base"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
