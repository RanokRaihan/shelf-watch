"use server";

import { requireSession } from "@/lib/auth/session";
import { parseBarcode, type ParsedBarcode } from "@/lib/barcode/gtin";
import { ok } from "@/lib/core/action-result";
import { AppError } from "@/lib/core/errors";
import { createAction } from "@/lib/core/safe-action";
import { lookUpExternalProduct } from "@/lib/products/lookup/lookup-external-product";
import {
  createProduct,
  findStoreProduct,
  type StoreProductDetails,
} from "@/lib/products/products";
import { createPullItem, listPendingPullItems, type PendingPullItem } from "@/lib/pulls/pull-items";
import {
  barcodeLookupSchema,
  createProductSchema,
  createPullItemSchema,
  externalLookupSchema,
} from "@/lib/validations/scan.validation";

export type BarcodeLookupResult =
  | {
      kind: "known";
      barcode: ParsedBarcode;
      product: StoreProductDetails;
      pendingItems: PendingPullItem[];
    }
  | { kind: "unknown"; barcode: ParsedBarcode };

// The store comes from the session, never from the client.
async function actor() {
  const { user } = await requireSession();
  return {
    storeId: user.storeId,
    userId: user.id,
    timezone: user.store.timezone,
    defaultLeadDays: user.store.defaultLeadDays,
  };
}

function parseOrThrow(barcode: string, format?: ParsedBarcode["barcodeFormat"]): ParsedBarcode {
  const parsed = parseBarcode(barcode, format);
  if (!parsed.ok) throw new AppError("VALIDATION", "Couldn't read that barcode.");
  return parsed.barcode;
}

export const lookUpBarcodeAction = createAction(
  barcodeLookupSchema,
  async ({ barcode, format }): Promise<BarcodeLookupResult> => {
    const store = await actor();
    const parsed = parseOrThrow(barcode, format);
    const product = await findStoreProduct(store, parsed.gtin);
    if (!product) return { kind: "unknown", barcode: parsed };
    const pendingItems = await listPendingPullItems(store.storeId, parsed.gtin);
    return { kind: "known", barcode: parsed, product, pendingItems };
  },
);

export const lookUpExternalProductAction = createAction(externalLookupSchema, async ({ gtin }) => {
  await actor();
  return lookUpExternalProduct(gtin);
});

export const createProductAction = createAction(createProductSchema, async (values) => {
  const store = await actor();
  return createProduct(store, { ...values, barcode: parseOrThrow(values.barcode, values.format) });
});

export const createPullItemAction = createAction(createPullItemSchema, async (values) => {
  const result = await createPullItem(await actor(), values);
  return ok(result, "Pull date saved");
});
