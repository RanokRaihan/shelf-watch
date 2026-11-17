import "server-only";

import { z } from "zod";

import type { ProductProvider } from "@/lib/products/lookup/product-provider";

const API_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,product_name_en,brands,quantity,image_front_url";
const USER_AGENT = "ShelfWatch/0.1";

const responseSchema = z.object({
  status: z.number(),
  product: z
    .object({
      product_name: z.string().optional(),
      product_name_en: z.string().optional(),
      brands: z.string().optional(),
      quantity: z.string().optional(),
      image_front_url: z.string().optional(),
    })
    .optional(),
});

// Open Food Facts keys products by EAN-13, or EAN-8 for short codes.
function toOpenFoodFactsCode(gtin: string): string {
  return gtin.startsWith("000000") ? gtin.slice(6) : gtin.slice(1);
}

export const openFoodFacts: ProductProvider = {
  source: "OPEN_FOOD_FACTS",
  async lookUp(gtin, signal) {
    const response = await fetch(`${API_URL}/${toOpenFoodFactsCode(gtin)}?fields=${FIELDS}`, {
      signal,
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (response.status === 404) return { kind: "not-found" };
    if (!response.ok) throw new Error(`Open Food Facts answered ${response.status}`);

    const body = responseSchema.parse(await response.json());
    if (body.status !== 1 || !body.product) return { kind: "not-found" };

    const { product } = body;
    return {
      kind: "found",
      product: {
        name: product.product_name || product.product_name_en || "",
        brand: product.brands?.split(",")[0] ?? "",
        size: product.quantity ?? "",
        imageUrl: product.image_front_url ?? "",
      },
    };
  },
};
