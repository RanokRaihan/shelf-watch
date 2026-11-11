"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { managerLoginAction } from "@/actions/manager-login.action";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Password for manager access (docs/auth-flow.md 4.5). On success the action
// redirects to /manage. A wrong or locked password shows under the field;
// anything else (signed out, not a manager) toasts and refreshes so the
// page's guard sends the user to the right place.
export function ManagerLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      // POST, so a submit before hydration never puts secrets in the URL.
      method="post"
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (isPending) return;
        if (!password) {
          setError("Enter your password");
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await managerLoginAction({ password });
          if (result.ok) return;

          setPassword("");
          const fieldError = result.error.fieldErrors?.password?.[0];
          if (fieldError) {
            setError(fieldError);
            return;
          }
          toast.error(result.error.message);
          router.refresh();
        });
      }}
    >
      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isRevealed ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            // readOnly, not disabled, so focus stays here after a wrong try.
            readOnly={isPending}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? "password-error" : undefined}
            className="h-12 pr-12 text-base"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isRevealed ? "Hide password" : "Show password"}
            aria-pressed={isRevealed}
            onClick={() => setIsRevealed((value) => !value)}
            className="absolute top-1/2 right-1 size-10 -translate-y-1/2"
          >
            {isRevealed ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
        {error ? (
          <FieldError id="password-error" className="text-base">
            {error}
          </FieldError>
        ) : null}
      </Field>

      <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
        {isPending ? "Checking…" : "Confirm"}
      </Button>
    </form>
  );
}
