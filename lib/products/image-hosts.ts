// Hosts product images may come from. `next.config.ts` allows the same list for `next/image`.
export const PRODUCT_IMAGE_HOSTS = ["images.openfoodfacts.org", "static.openfoodfacts.org"];

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PRODUCT_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
