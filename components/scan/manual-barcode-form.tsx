"use client";

import { useForm } from "@tanstack/react-form";
import { Search } from "lucide-react";

import { TextField } from "@/components/form/text-field";
import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";
import { parseBarcode, type ParsedBarcode } from "@/lib/barcode/gtin";
import { barcodeLookupSchema, type BarcodeLookupValues } from "@/lib/validations/scan.validation";

const defaultValues: BarcodeLookupValues = { barcode: "" };

export function ManualBarcodeForm({
  onSubmit,
  onRescan,
}: {
  onSubmit: (barcode: ParsedBarcode) => void;
  onRescan: () => void;
}) {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: barcodeLookupSchema },
    onSubmit: ({ value }) => {
      const parsed = parseBarcode(barcodeLookupSchema.parse(value).barcode);
      if (parsed.ok) onSubmit(parsed.barcode);
    },
  });

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <ScanScreen
        title="Type the barcode number"
        description="Enter all the digits printed under the bars."
        actions={
          <>
            <Button type="submit" className={SCREEN_BUTTON_CLASS}>
              <Search aria-hidden="true" />
              Look up
            </Button>
            <Button type="button" variant="outline" onClick={onRescan} className={SCREEN_BUTTON_CLASS}>
              Rescan
            </Button>
          </>
        }
      >
        <form.Field name="barcode">
          {(field) => (
            <TextField
              field={field}
              label="Barcode number"
              required
              inputMode="numeric"
              autoComplete="off"
              placeholder="012345678905"
              className="font-mono tracking-wider"
            />
          )}
        </form.Field>
      </ScanScreen>
    </form>
  );
}
