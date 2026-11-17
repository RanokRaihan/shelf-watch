"use client";

import { useCallback, useRef, type Dispatch } from "react";

import { lookUpBarcodeAction, lookUpExternalProductAction } from "@/actions/scan.action";
import {
  EMPTY_PREFILL,
  type ProductPrefill,
  type ScanFlowAction,
} from "@/components/scan/scan-flow-reducer";
import type { ParsedBarcode } from "@/lib/barcode/gtin";

const OFFLINE_MESSAGE = "We couldn't reach the server. Check your connection and try again.";
const PROVIDER_FAILED_MESSAGE = "The product database didn't answer in time.";

type ExternalOutcome = { kind: "prefill"; prefill: ProductPrefill } | { kind: "failed"; message: string };

async function lookUpExternal(gtin: string): Promise<ExternalOutcome> {
  const result = await lookUpExternalProductAction({ gtin });
  if (!result.ok) return { kind: "failed", message: result.error.message };

  const lookup = result.data;
  if (lookup.kind === "failed") return { kind: "failed", message: PROVIDER_FAILED_MESSAGE };
  if (lookup.kind === "not-found") {
    return { kind: "prefill", prefill: { ...EMPTY_PREFILL, lookupStatus: "NOT_FOUND", source: null } };
  }
  return {
    kind: "prefill",
    prefill: { ...lookup.product, lookupStatus: "FOUND", source: lookup.source },
  };
}

/** Our database first; only an unknown product goes to the third-party lookup. */
export function useBarcodeLookup(dispatch: Dispatch<ScanFlowAction>) {
  const lastLookupId = useRef(0);

  return useCallback(
    async (barcode: ParsedBarcode) => {
      const lookupId = ++lastLookupId.current;
      dispatch({ type: "LOOKUP_STARTED", lookupId, barcode });

      try {
        const result = await lookUpBarcodeAction({
          barcode: barcode.barcodeValue,
          format: barcode.barcodeFormat,
        });
        if (!result.ok) {
          dispatch({ type: "LOOKUP_FAILED", lookupId, message: result.error.message });
          return;
        }
        if (result.data.kind === "known") {
          dispatch({ type: "PRODUCT_KNOWN", lookupId, result: result.data });
          return;
        }

        const external = await lookUpExternal(barcode.gtin);
        dispatch(
          external.kind === "prefill"
            ? { type: "PRODUCT_UNKNOWN", lookupId, prefill: external.prefill }
            : { type: "LOOKUP_FAILED", lookupId, message: external.message },
        );
      } catch {
        dispatch({ type: "LOOKUP_FAILED", lookupId, message: OFFLINE_MESSAGE });
      }
    },
    [dispatch],
  );
}
