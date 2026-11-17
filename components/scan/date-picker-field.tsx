"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { RequiredMark } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay } from "@/lib/format/calendar-day";
import { parseDay, toDay } from "@/lib/pulls/pull-dates";

type DatePickerFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (day: string) => void;
  onBlur?: () => void;
  firstDay: string;
  lastDay: string;
  invalid: boolean;
  errors: { message?: string }[];
  description?: string;
  clearable?: boolean;
};

export function DatePickerField({
  id,
  label,
  required,
  value,
  onChange,
  onBlur,
  firstDay,
  lastDay,
  invalid,
  errors,
  description,
  clearable,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDay(value) ?? undefined;
  const first = parseDay(firstDay) ?? undefined;
  const last = parseDay(lastDay) ?? undefined;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <RequiredMark />}
      </FieldLabel>
      <div className="flex gap-2">
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) onBlur?.();
          }}
        >
          <PopoverTrigger
            render={
              <Button
                id={id}
                type="button"
                variant="outline"
                aria-invalid={invalid}
                aria-required={required}
                className="h-12 flex-1 justify-start gap-2 px-3 text-base font-normal"
              />
            }
          >
            <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
            {value ? formatDay(value) : <span className="text-muted-foreground">Pick a date</span>}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected ?? first}
              captionLayout="dropdown"
              startMonth={first}
              endMonth={last}
              disabled={[...(first ? [{ before: first }] : []), ...(last ? [{ after: last }] : [])]}
              onSelect={(date) => {
                onChange(date ? toDay(date) : "");
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {clearable && value && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange("")}
            className="h-12 text-base"
          >
            Clear
          </Button>
        )}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && <FieldError errors={errors} />}
    </Field>
  );
}
