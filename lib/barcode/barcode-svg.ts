import "server-only";

import { toSVG } from "bwip-js/node";

import type { BarcodeFormat } from "@/app/generated/prisma/client";

const BCID: Record<BarcodeFormat, string> = {
  UPC_A: "upca",
  UPC_E: "upce",
  EAN_13: "ean13",
  EAN_8: "ean8",
};

/**
 * A retail barcode with its digits as an SVG string, rendered on the server.
 * Has a viewBox but no size, so CSS sizes it. Always black on white so
 * scanners read it. Null when bwip rejects the value (bad check digit).
 */
export function barcodeSvg(format: BarcodeFormat, value: string): string | null {
  try {
    return toSVG({
      bcid: BCID[format],
      text: value,
      includetext: true,
      textxalign: "center",
      scale: 2,
      height: 12,
    });
  } catch {
    return null;
  }
}
