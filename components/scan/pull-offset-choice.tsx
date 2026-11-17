"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PULL_OFFSETS, type PullOffset } from "@/lib/pulls/pull-dates";

function toOffset(value: string | undefined): PullOffset | null {
  return PULL_OFFSETS.find((option) => option.value === value)?.value ?? null;
}

export function PullOffsetChoice({
  value,
  onChange,
}: {
  value: PullOffset | null;
  onChange: (offset: PullOffset | null) => void;
}) {
  return (
    <Field>
      <FieldLabel id="pull-offset-label">Pull before expiry</FieldLabel>
      <ToggleGroup
        aria-labelledby="pull-offset-label"
        variant="outline"
        value={value ? [value] : []}
        onValueChange={(values) => onChange(toOffset(values[0]))}
        className="grid w-full grid-cols-2 sm:grid-cols-4"
      >
        {PULL_OFFSETS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} className="h-12 text-base">
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldDescription>Fills the pull date from the expiry date.</FieldDescription>
    </Field>
  );
}
