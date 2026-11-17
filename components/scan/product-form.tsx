"use client";

import { useForm } from "@tanstack/react-form";
import { Info } from "lucide-react";

import { createProductAction } from "@/actions/scan.action";
import { TextField } from "@/components/form/text-field";
import { ProductImagePreview } from "@/components/scan/product-image-preview";
import type { ProductPrefill } from "@/components/scan/scan-flow-reducer";
import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import type { ParsedBarcode } from "@/lib/barcode/gtin";
import { toFormErrors } from "@/lib/core/action-result";
import type { StoreProductDetails } from "@/lib/products/products";
import {
  PRODUCT_BRAND_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_SIZE_MAX,
  productFieldsSchema,
  type ProductFieldsValues,
} from "@/lib/validations/scan.validation";

type ProductFormProps = {
  barcode: ParsedBarcode;
  prefill: ProductPrefill;
  onSaved: (product: StoreProductDetails) => void;
  onRescan: () => void;
};

export function ProductForm({ barcode, prefill, onSaved, onRescan }: ProductFormProps) {
  const defaultValues: ProductFieldsValues = {
    name: prefill.name,
    brand: prefill.brand,
    size: prefill.size,
    imageUrl: prefill.imageUrl,
  };
  const fromDatabase = prefill.lookupStatus === "FOUND";

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: productFieldsSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await createProductAction({
          ...value,
          barcode: barcode.barcodeValue,
          format: barcode.barcodeFormat,
          lookupStatus: prefill.lookupStatus,
          source: prefill.source,
        });
        if (!result.ok) return toFormErrors(result);
        onSaved(result.data);
        return undefined;
      },
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
        title={fromDatabase ? "Check the product" : "New product"}
        description={
          fromDatabase ? undefined : "We don't know this product yet. Add its details."
        }
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
                    {isSubmitting ? "Saving…" : "Save product"}
                  </Button>
                </>
              )}
            </form.Subscribe>
            <Button type="button" variant="outline" onClick={onRescan} className={SCREEN_BUTTON_CLASS}>
              Rescan
            </Button>
          </>
        }
      >
        <Field>
          <FieldTitle>Barcode number</FieldTitle>
          <p className="font-mono text-xl tracking-wider">{barcode.barcodeValue}</p>
        </Field>
        {fromDatabase && (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-base">
            <Info className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            Check these details before saving.
          </p>
        )}
        <form.Field name="name">
          {(field) => (
            <TextField
              field={field}
              label="Product name"
              required
              maxLength={PRODUCT_NAME_MAX}
              autoComplete="off"
            />
          )}
        </form.Field>
        <form.Field name="brand">
          {(field) => (
            <TextField
              field={field}
              label="Brand (optional)"
              maxLength={PRODUCT_BRAND_MAX}
              autoComplete="off"
            />
          )}
        </form.Field>
        <form.Field name="size">
          {(field) => (
            <TextField
              field={field}
              label="Size (optional)"
              placeholder="12 fl oz"
              maxLength={PRODUCT_SIZE_MAX}
              autoComplete="off"
            />
          )}
        </form.Field>
        <form.Field name="imageUrl">
          {(field) =>
            field.state.value ? (
              <Field>
                <FieldTitle>Image (optional)</FieldTitle>
                <ProductImagePreview src={field.state.value} onRemove={() => field.handleChange("")} />
              </Field>
            ) : null
          }
        </form.Field>
      </ScanScreen>
    </form>
  );
}
