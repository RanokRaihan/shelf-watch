"use client";

import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";

import { createPullItemAction } from "@/actions/scan.action";
import { TextField, isFieldInvalid, toFieldErrors } from "@/components/form/text-field";
import { DatePickerField } from "@/components/scan/date-picker-field";
import { LocationFields } from "@/components/scan/location-fields";
import { ProductSummary } from "@/components/scan/product-summary";
import { PullOffsetChoice } from "@/components/scan/pull-offset-choice";
import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { toFormErrors } from "@/lib/core/action-result";
import type { StoreProductDetails } from "@/lib/products/products";
import {
  latestAllowedDay,
  offsetForLeadDays,
  pullDayForOffset,
  todayIn,
  type PullOffset,
} from "@/lib/pulls/pull-dates";
import {
  LOCATION_PART_MAX,
  pullItemFieldsSchema,
  type PullItemFieldsValues,
} from "@/lib/validations/scan.validation";

export type SavedPullItem = { productName: string; pullDate: string };

type DateEntryFormProps = {
  product: StoreProductDetails;
  barcodeValue: string;
  timezone: string;
  onSaved: (saved: SavedPullItem) => void;
  onCancel: () => void;
};

function locationSummary(parts: { label: string; value: string }[]): string {
  const filled = parts.filter((part) => part.value.trim() !== "");
  return filled.length > 0
    ? filled.map((part) => `${part.label} ${part.value.trim()}`).join(" · ")
    : "Not set";
}

export function DateEntryForm({
  product,
  barcodeValue,
  timezone,
  onSaved,
  onCancel,
}: DateEntryFormProps) {
  const today = todayIn(timezone);
  const lastDay = latestAllowedDay(today);
  const schema = useMemo(() => pullItemFieldsSchema(today), [today]);
  const [offset, setOffset] = useState<PullOffset | null>(() => offsetForLeadDays(product.leadDays));
  const [clampedToToday, setClampedToToday] = useState(false);

  const defaultValues: PullItemFieldsValues = {
    expiryDate: "",
    pullDate: "",
    aisle: product.aisle ?? "",
    section: product.section ?? "",
    shelf: product.shelf ?? "",
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: schema,
      onSubmitAsync: async ({ value }) => {
        const result = await createPullItemAction({ ...value, gtin: product.gtin });
        if (!result.ok) return toFormErrors(result);
        onSaved({ productName: result.data.productName, pullDate: value.pullDate });
        return undefined;
      },
    },
  });

  const fillPullDate = (expiryDate: string, nextOffset: PullOffset | null) => {
    const filled = expiryDate && nextOffset ? pullDayForOffset(expiryDate, nextOffset, today) : null;
    if (filled) form.setFieldValue("pullDate", filled.pullDate);
    setClampedToToday(filled?.clampedToToday ?? false);
  };

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
        title="Set the pull date"
        actions={
          <>
            <form.Subscribe
              selector={(state) => ({
                formError: state.errorMap.onSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ formError, isSubmitting }) => (
                <>
                  {typeof formError === "string" && (
                    <FieldError className="w-full text-base">{formError}</FieldError>
                  )}
                  <Button type="submit" disabled={isSubmitting} className={SCREEN_BUTTON_CLASS}>
                    {isSubmitting ? "Saving…" : "Save pull date"}
                  </Button>
                </>
              )}
            </form.Subscribe>
            <Button type="button" variant="outline" onClick={onCancel} className={SCREEN_BUTTON_CLASS}>
              Cancel
            </Button>
          </>
        }
      >
        <ProductSummary
          name={product.name}
          brand={product.brand}
          size={product.size}
          barcodeValue={barcodeValue}
        />

        <form.Field name="expiryDate">
          {(field) => (
            <DatePickerField
              id={field.name}
              label="Expiry date (optional)"
              value={field.state.value}
              onChange={(day) => {
                field.handleChange(day);
                fillPullDate(day, offset);
              }}
              onBlur={field.handleBlur}
              firstDay={today}
              lastDay={lastDay}
              invalid={isFieldInvalid(field)}
              errors={toFieldErrors(field.state.meta.errors)}
              clearable
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.expiryDate}>
          {(expiryDate) =>
            expiryDate ? (
              <PullOffsetChoice
                value={offset}
                onChange={(nextOffset) => {
                  setOffset(nextOffset);
                  fillPullDate(expiryDate, nextOffset);
                }}
              />
            ) : null
          }
        </form.Subscribe>

        <form.Field name="pullDate">
          {(field) => (
            <DatePickerField
              id={field.name}
              label="Pull date"
              required
              value={field.state.value}
              onChange={(day) => {
                field.handleChange(day);
                setOffset(null);
                setClampedToToday(false);
              }}
              onBlur={field.handleBlur}
              firstDay={today}
              lastDay={lastDay}
              invalid={isFieldInvalid(field)}
              errors={toFieldErrors(field.state.meta.errors)}
              description={
                clampedToToday
                  ? "That offset lands before today, so the pull date is set to today."
                  : undefined
              }
            />
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) =>
            locationSummary([
              { label: "Aisle", value: state.values.aisle },
              { label: "Section", value: state.values.section },
              { label: "Shelf", value: state.values.shelf },
            ])
          }
        >
          {(summary) => (
            <LocationFields summary={summary}>
              <form.Field name="aisle">
                {(field) => (
                  <TextField field={field} label="Aisle" maxLength={LOCATION_PART_MAX} autoComplete="off" />
                )}
              </form.Field>
              <form.Field name="section">
                {(field) => (
                  <TextField field={field} label="Section" maxLength={LOCATION_PART_MAX} autoComplete="off" />
                )}
              </form.Field>
              <form.Field name="shelf">
                {(field) => (
                  <TextField field={field} label="Shelf" maxLength={LOCATION_PART_MAX} autoComplete="off" />
                )}
              </form.Field>
            </LocationFields>
          )}
        </form.Subscribe>
      </ScanScreen>
    </form>
  );
}
