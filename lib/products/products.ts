import "server-only";

import type { LookupStatus, Prisma, ProductSource } from "@/app/generated/prisma/client";
import type { ParsedBarcode } from "@/lib/barcode/gtin";
import { db } from "@/lib/db";

export type ScanStore = { storeId: string; defaultLeadDays: number };

export type StoreProductDetails = {
  gtin: string;
  name: string;
  brand: string | null;
  size: string | null;
  imageUrl: string | null;
  aisle: string | null;
  section: string | null;
  shelf: string | null;
  leadDays: number;
};

export type NewProduct = {
  barcode: ParsedBarcode;
  name: string;
  brand: string;
  size: string;
  imageUrl: string;
  lookupStatus: LookupStatus;
  source: ProductSource | null;
};

const storeProductInclude = {
  product: { select: { name: true, brand: true, size: true, imageUrl: true } },
} as const;

type StoreProductRow = Prisma.StoreProductGetPayload<{ include: typeof storeProductInclude }>;

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

// The store's own name overrides the shared one.
export function productDisplayName(storeName: string | null, sharedName: string | null): string {
  return storeName ?? sharedName ?? "Unnamed product";
}

function toDetails(row: StoreProductRow, defaultLeadDays: number): StoreProductDetails {
  return {
    gtin: row.gtin,
    name: productDisplayName(row.name, row.product.name),
    brand: row.product.brand,
    size: row.product.size,
    imageUrl: row.product.imageUrl,
    aisle: row.aisle,
    section: row.section,
    shelf: row.shelf,
    leadDays: row.leadDays ?? defaultLeadDays,
  };
}

function upsertStoreProduct(client: Prisma.TransactionClient, storeId: string, gtin: string) {
  const now = new Date();
  return client.storeProduct.upsert({
    where: { storeId_gtin: { storeId, gtin } },
    create: { storeId, gtin, lastScannedAt: now },
    update: { lastScannedAt: now },
    include: storeProductInclude,
  });
}

/** The product as this store sees it, or null when no store has saved it yet. Links it to the store. */
export async function findStoreProduct(
  store: ScanStore,
  gtin: string,
): Promise<StoreProductDetails | null> {
  const product = await db.product.findUnique({ where: { gtin }, select: { gtin: true } });
  if (!product) return null;
  const row = await upsertStoreProduct(db, store.storeId, gtin);
  return toDetails(row, store.defaultLeadDays);
}

// Create-only: if another user saved this GTIN first, their row stays as it is.
export async function createProduct(
  store: ScanStore,
  product: NewProduct,
): Promise<StoreProductDetails> {
  const { barcode } = product;
  const row = await db.$transaction(async (tx) => {
    await tx.product.upsert({
      where: { gtin: barcode.gtin },
      update: {},
      create: {
        gtin: barcode.gtin,
        barcodeFormat: barcode.barcodeFormat,
        barcodeValue: barcode.barcodeValue,
        name: product.name,
        brand: emptyToNull(product.brand),
        size: emptyToNull(product.size),
        imageUrl: emptyToNull(product.imageUrl),
        lookupStatus: product.lookupStatus,
        source: product.source,
        lookedUpAt: new Date(),
      },
    });
    return upsertStoreProduct(tx, store.storeId, barcode.gtin);
  });
  return toDetails(row, store.defaultLeadDays);
}
