"use client";

import { AlreadyTrackedScreen } from "@/components/scan/already-tracked-screen";
import { DateEntryForm, type SavedPullItem } from "@/components/scan/date-entry-form";
import { InvalidBarcodeScreen } from "@/components/scan/invalid-barcode-screen";
import { LookingUpScreen } from "@/components/scan/looking-up-screen";
import { LookupFailedScreen } from "@/components/scan/lookup-failed-screen";
import { ManualBarcodeForm } from "@/components/scan/manual-barcode-form";
import { ProductForm } from "@/components/scan/product-form";
import type { ScanFlowState } from "@/components/scan/scan-flow-reducer";
import type { ParsedBarcode } from "@/lib/barcode/gtin";
import type { StoreProductDetails } from "@/lib/products/products";

export type ScanStepHandlers = {
  rescan: () => void;
  typeNumber: () => void;
  lookUp: (barcode: ParsedBarcode) => void;
  retryLookup: () => void;
  enterManually: () => void;
  productSaved: (product: StoreProductDetails) => void;
  addAnotherDate: () => void;
  pullItemSaved: (saved: SavedPullItem) => void;
};

/** The screen for every step after the scan. */
export function ScanStepScreen({
  state,
  timezone,
  handlers,
}: {
  state: ScanFlowState;
  timezone: string;
  handlers: ScanStepHandlers;
}) {
  const { step, barcode, product, prefill } = state;

  if (step === "invalid-barcode") {
    return <InvalidBarcodeScreen onRescan={handlers.rescan} onTypeNumber={handlers.typeNumber} />;
  }
  if (step === "manual-entry") {
    return <ManualBarcodeForm onSubmit={handlers.lookUp} onRescan={handlers.rescan} />;
  }
  if (step === "looking-up" && barcode) {
    return <LookingUpScreen barcodeValue={barcode.barcodeValue} onCancel={handlers.rescan} />;
  }
  if (step === "lookup-failed" && barcode) {
    return (
      <LookupFailedScreen
        barcodeValue={barcode.barcodeValue}
        message={state.lookupError}
        onRetry={handlers.retryLookup}
        onEnterManually={handlers.enterManually}
        onRescan={handlers.rescan}
      />
    );
  }
  if (step === "product-form" && barcode && prefill) {
    return (
      <ProductForm
        barcode={barcode}
        prefill={prefill}
        onSaved={handlers.productSaved}
        onRescan={handlers.rescan}
      />
    );
  }
  if (step === "already-tracked" && barcode && product) {
    return (
      <AlreadyTrackedScreen
        product={product}
        barcodeValue={barcode.barcodeValue}
        pendingItems={state.pendingItems}
        onCancel={handlers.rescan}
        onAddDate={handlers.addAnotherDate}
      />
    );
  }
  if (step === "date-form" && barcode && product) {
    return (
      <DateEntryForm
        product={product}
        barcodeValue={barcode.barcodeValue}
        timezone={timezone}
        onSaved={handlers.pullItemSaved}
        onCancel={handlers.rescan}
      />
    );
  }
  return null;
}
