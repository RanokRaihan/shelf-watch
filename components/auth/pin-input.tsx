"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";

type PinInputProps = {
  length: number;
  /** Digits entered so far. Always filled from the left, never with gaps. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Focus the first box on load, and again whenever the value is cleared. */
  autoFocus?: boolean;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

// One box per digit. The value stays contiguous: focusing a box past the
// first empty one jumps back to it, so there are never gaps. Typing moves
// forward, Backspace moves back, and pasting fills from the focused box.
export function PinInput({
  length,
  value,
  onChange,
  disabled,
  invalid,
  autoFocus,
  ...aria
}: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Focus moves before React re-renders with the new value, so `onFocus`
  // reads this instead of the (stale) `value` prop.
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focusBox = (index: number) => {
    const box = refs.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  };

  // Runs on load and after a failed try clears the value and re-enables the
  // boxes (a disabled input can't take focus).
  useEffect(() => {
    if (autoFocus && value === "" && !disabled) focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, value, disabled]);

  const update = (next: string) => {
    latest.current = next;
    onChange(next);
  };

  const fill = (index: number, chars: string) => {
    if (!chars) return;
    const next = (value.slice(0, index) + chars + value.slice(index + chars.length)).slice(0, length);
    update(next);
    focusBox(index + chars.length);
  };

  return (
    <div role="group" className="flex justify-center gap-3" {...aria}>
      {digits.map((digit, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          // Text with masking, not type="password": iOS ignores inputMode on
          // password fields, and this keeps password managers out of it.
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`PIN digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={digit}
          onFocus={(event) => {
            if (i > latest.current.length) focusBox(latest.current.length);
            else event.currentTarget.select();
          }}
          onChange={(event) => {
            let raw = event.currentTarget.value.replace(/\D/g, "");
            // Cleared natively (some Android keyboards skip the keydown).
            if (!event.currentTarget.value) {
              update(value.slice(0, i) + value.slice(i + 1));
              return;
            }
            // If the box already held a digit and the caret wasn't on it, the
            // browser gives both; keep only the new one.
            if (digit && raw.length === 2) raw = raw.replace(digit, "");
            fill(i, raw);
          }}
          onPaste={(event) => {
            event.preventDefault();
            fill(i, event.clipboardData.getData("text").replace(/\D/g, ""));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              if (digit) {
                update(value.slice(0, i) + value.slice(i + 1));
                focusBox(i);
              } else if (i > 0) {
                update(value.slice(0, i - 1));
                focusBox(i - 1);
              }
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              focusBox(i - 1);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              focusBox(Math.min(i + 1, value.length));
            }
          }}
          className={cn(
            "size-14 p-0 text-center text-2xl font-semibold md:text-2xl",
            "[-webkit-text-security:disc]",
            digit && "border-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
