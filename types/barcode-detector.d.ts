// Native Barcode Detection API — shipped in Chrome/Android but absent from
// TypeScript's DOM lib. https://developer.mozilla.org/docs/Web/API/BarcodeDetector

interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: CanvasImageSource | Blob | ImageData): Promise<DetectedBarcode[]>;
}

interface Window {
  /** Undefined on iOS Safari and Firefox — check before using. */
  BarcodeDetector?: typeof BarcodeDetector;
}
