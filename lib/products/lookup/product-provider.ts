import type { ProductSource } from "@/app/generated/prisma/client";

// Empty strings for anything the source doesn't have.
export type ProviderProduct = {
  name: string;
  brand: string;
  size: string;
  imageUrl: string;
};

export type ProviderResult = { kind: "found"; product: ProviderProduct } | { kind: "not-found" };

/** A third-party product database. `lookUp` throws on network or server errors. */
export type ProductProvider = {
  source: ProductSource;
  lookUp: (gtin: string, signal: AbortSignal) => Promise<ProviderResult>;
};
