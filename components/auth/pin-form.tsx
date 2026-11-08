"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PIN_LENGTH } from "@/lib/validations/register.validation";

// UI only. The PIN check (docs/auth-flow.md 4.4) isn't built yet, so submit
// just says so. No server action and no cookies.
export function PinForm() {
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        toast("PIN sign-in isn't ready yet");
      }}
    >
      <Field>
        <FieldLabel htmlFor="pin">PIN</FieldLabel>
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern={`\\d{${PIN_LENGTH}}`}
          maxLength={PIN_LENGTH}
          required
          autoFocus
          className="h-12 text-base tracking-widest"
        />
      </Field>
      <Button type="submit" className="h-12 w-full text-base">
        Unlock
      </Button>
    </form>
  );
}
