import { z } from "zod";

import {
  BARCODE_FORMATS,
  BARCODE_PROBLEM_MESSAGES,
  isValidGtin14,
  parseBarcode,
} from "@/lib/barcode/gtin";
import { isAllowedImageUrl } from "@/lib/products/image-hosts";
import { isDay, latestAllowedDay } from "@/lib/pulls/pull-dates";

export const PRODUCT_NAME_MAX = 100;
export const PRODUCT_BRAND_MAX = 60;
export const PRODUCT_SIZE_MAX = 30;
export const LOCATION_PART_MAX = 20;

export const LOOKUP_STATUSES = ["FOUND", "NOT_FOUND", "FAILED"] as const;
export const PRODUCT_SOURCES = ["OPEN_FOOD_FACTS", "UPCITEMDB"] as const;

// Spaces are dropped so "0 12345 67890 5", as printed under the bars, still works.
const barcodeInputSchema = z.string().transform((value) => value.replace(/\s+/g, ""));

export const barcodeLookupSchema = z
  .object({
    barcode: barcodeInputSchema.pipe(z.string().min(1, "Enter the barcode number")),
    format: z.enum(BARCODE_FORMATS).optional(),
  })
  .superRefine(({ barcode, format }, ctx) => {
    const parsed = parseBarcode(barcode, format);
    if (!parsed.ok) {
      ctx.addIssue({ code: "custom", path: ["barcode"], message: BARCODE_PROBLEM_MESSAGES[parsed.problem] });
    }
  });

export type BarcodeLookupValues = z.input<typeof barcodeLookupSchema>;

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`);

export const productFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the product name")
    .max(PRODUCT_NAME_MAX, `Name must be ${PRODUCT_NAME_MAX} characters or fewer`)
    .refine((value) => !/^\d+$/.test(value), "The name can't be only numbers"),
  brand: optionalText("Brand", PRODUCT_BRAND_MAX),
  size: optionalText("Size", PRODUCT_SIZE_MAX),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || isAllowedImageUrl(value), "This image can't be used"),
});

export type ProductFieldsValues = z.input<typeof productFieldsSchema>;

export const createProductSchema = productFieldsSchema
  .extend({
    barcode: z.string(),
    format: z.enum(BARCODE_FORMATS),
    lookupStatus: z.enum(LOOKUP_STATUSES),
    source: z.enum(PRODUCT_SOURCES).nullable(),
  })
  .superRefine(({ barcode, format, lookupStatus, source }, ctx) => {
    const parsed = parseBarcode(barcode, format);
    if (!parsed.ok) {
      ctx.addIssue({ code: "custom", path: ["barcode"], message: BARCODE_PROBLEM_MESSAGES[parsed.problem] });
    }
    if ((lookupStatus === "FOUND") !== (source !== null)) {
      ctx.addIssue({ code: "custom", path: ["source"], message: "Source must match the lookup result" });
    }
  });

export type CreateProductValues = z.input<typeof createProductSchema>;

// "Today" is the store's today, so the client and server build the schema with it.
export function pullItemFieldsSchema(today: string) {
  const latest = latestAllowedDay(today);
  const tooFar = "That's more than 5 years away. Check the year.";

  const fields = z.object({
    expiryDate: z
      .string()
      .refine((value) => value === "" || isDay(value), "Pick a valid date")
      .refine((value) => value === "" || value >= today, "Expiry date can't be in the past")
      .refine((value) => value === "" || value <= latest, tooFar),
    pullDate: z
      .string()
      .min(1, "Pick a pull date")
      .refine(isDay, "Pick a valid date")
      .refine((value) => value >= today, "Pull date can't be in the past")
      .refine((value) => value <= latest, tooFar),
    aisle: optionalText("Aisle", LOCATION_PART_MAX),
    section: optionalText("Section", LOCATION_PART_MAX),
    shelf: optionalText("Shelf", LOCATION_PART_MAX),
  });

  // `when` lets this run even when another field fails, so it shows in the same submit.
  return fields.refine(
    ({ expiryDate, pullDate }) => expiryDate === "" || pullDate <= expiryDate,
    {
      error: "Pull date must be on or before the expiry date",
      path: ["pullDate"],
      when: (payload) =>
        fields.pick({ expiryDate: true, pullDate: true }).safeParse(payload.value).success,
    },
  );
}

export type PullItemFieldsValues = z.input<ReturnType<typeof pullItemFieldsSchema>>;

const gtinSchema = z.string().refine(isValidGtin14, "Scan the product again");

export const externalLookupSchema = z.object({ gtin: gtinSchema });

// Shape only: the date rules need the store's today, so `createPullItem` re-checks with `pullItemFieldsSchema`.
export const createPullItemSchema = z.object({
  gtin: gtinSchema,
  expiryDate: z.string(),
  pullDate: z.string(),
  aisle: z.string(),
  section: z.string(),
  shelf: z.string(),
});

export type CreatePullItemValues = z.input<typeof createPullItemSchema>;
