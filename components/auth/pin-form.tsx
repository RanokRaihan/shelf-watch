"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { unlockAction } from "@/actions/unlock.action";
import { PinInput } from "@/components/auth/pin-input";
import { Button } from "@/components/ui/button";
import { PIN_LENGTH } from "@/lib/validations/register.validation";

// PIN unlock (docs/auth-flow.md 4.4). Submits only from the Unlock button (or
// Enter), never on its own when the boxes fill. On success the action
// redirects to /today. On failure the boxes clear and refocus.
export function PinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (value: string) => {
    if (isPending) return;
    if (value.length !== PIN_LENGTH) {
      setError(`Enter your ${PIN_LENGTH}-digit PIN`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await unlockAction({ pin: value });
      if (result.ok) return;

      setPin("");
      const fieldError = result.error.fieldErrors?.pin?.[0];
      if (fieldError) {
        setError(fieldError);
        return;
      }
      // The device is no longer trusted (revoked, disabled, pending):
      // re-render so /unlock shows the right screen.
      toast.error(result.error.message);
      router.refresh();
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit(pin);
      }}
    >
      <div className="flex flex-col gap-3">
        <span id="pin-label" className="sr-only">
          PIN
        </span>
        <PinInput
          length={PIN_LENGTH}
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (error) setError(null);
          }}
          disabled={isPending}
          invalid={!!error}
          autoFocus
          aria-labelledby="pin-label"
          aria-describedby={error ? "pin-error" : undefined}
        />
        <p
          id="pin-error"
          role="alert"
          className="min-h-6 text-center text-base text-destructive"
        >
          {error}
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="h-12 w-full text-base">
        {isPending ? "Unlocking…" : "Unlock"}
      </Button>
    </form>
  );
}
