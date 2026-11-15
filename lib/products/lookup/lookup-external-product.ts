import "server-only";

import type { ProductSource } from "@/app/generated/prisma/client";
import { isAllowedImageUrl } from "@/lib/products/image-hosts";
import { openFoodFacts } from "@/lib/products/lookup/open-food-facts";
import type { ProductProvider, ProviderProduct } from "@/lib/products/lookup/product-provider";
import {
  PRODUCT_BRAND_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_SIZE_MAX,
} from "@/lib/validations/scan.validation";

// Tried in order; the first match wins. Add new providers here.
const PROVIDERS: ProductProvider[] = [openFoodFacts];

const LOOKUP_TIMEOUT_MS = 5000;

export type ExternalLookup =
  | { kind: "found"; source: ProductSource; product: ProviderProduct }
  | { kind: "not-found" }
  | { kind: "failed" };

function clip(value: string, max: number): string {
  return value.trim().slice(0, max).trim();
}

// Third-party text goes into our form, so it gets the same limits as typed text.
function cleanProduct(product: ProviderProduct): ProviderProduct {
  const name = clip(product.name, PRODUCT_NAME_MAX);
  return {
    name: /^\d+$/.test(name) ? "" : name,
    brand: clip(product.brand, PRODUCT_BRAND_MAX),
    size: clip(product.size, PRODUCT_SIZE_MAX),
    imageUrl: isAllowedImageUrl(product.imageUrl) ? product.imageUrl : "",
  };
}

/** Asks each provider for the product. Saves nothing. */
export async function lookUpExternalProduct(gtin: string): Promise<ExternalLookup> {
  const signal = AbortSignal.timeout(LOOKUP_TIMEOUT_MS);
  let anyFailed = false;

  for (const provider of PROVIDERS) {
    try {
      const result = await provider.lookUp(gtin, signal);
      if (result.kind === "found") {
        return { kind: "found", source: provider.source, product: cleanProduct(result.product) };
      }
    } catch (error) {
      anyFailed = true;
      console.error(`[lookup] ${provider.source} failed`, error);
    }
  }

  return anyFailed ? { kind: "failed" } : { kind: "not-found" };
}
