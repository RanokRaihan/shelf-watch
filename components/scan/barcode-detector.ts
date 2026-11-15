import type {
  BarcodeDetector as PonyfillDetector,
  BarcodeFormat,
} from "barcode-detector/ponyfill";

import type { BarcodeFormat as ProductBarcodeFormat } from "@/lib/barcode/gtin";

// Retail product codes only; ZXing and the native detector both verify the check digit.
const FORMATS: BarcodeFormat[] = ["ean_13", "ean_8", "upc_a", "upc_e"];

export type Detector = Pick<PonyfillDetector, "detect">;

const PRODUCT_FORMATS: Partial<Record<BarcodeFormat, ProductBarcodeFormat>> = {
  ean_13: "EAN_13",
  ean_8: "EAN_8",
  upc_a: "UPC_A",
  upc_e: "UPC_E",
};

export function toProductFormat(format: BarcodeFormat): ProductBarcodeFormat | undefined {
  return PRODUCT_FORMATS[format];
}

let detectorPromise: Promise<Detector> | null = null;

// Native BarcodeDetector where it supports our formats (Chrome on Android), ZXing WASM elsewhere.
export function getDetector() {
  detectorPromise ??= createDetector().catch((error: unknown) => {
    detectorPromise = null;
    throw error;
  });
  return detectorPromise;
}

async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: typeof PonyfillDetector }).BarcodeDetector;
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats();
      if (FORMATS.every((format) => supported.includes(format))) {
        return new Native({ formats: FORMATS });
      }
    } catch {}
  }

  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path,
    },
    fireImmediately: true,
  });
  return new BarcodeDetector({ formats: FORMATS });
}
