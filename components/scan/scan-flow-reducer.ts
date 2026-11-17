import type { BarcodeLookupResult } from "@/actions/scan.action";
import type { ParsedBarcode } from "@/lib/barcode/gtin";
import type { StoreProductDetails } from "@/lib/products/products";
import type { PendingPullItem } from "@/lib/pulls/pull-items";
import type { CreateProductValues } from "@/lib/validations/scan.validation";

export type ScanStep =
  | "scanning"
  | "invalid-barcode"
  | "manual-entry"
  | "looking-up"
  | "lookup-failed"
  | "product-form"
  | "already-tracked"
  | "date-form";

export type ProductPrefill = Pick<
  CreateProductValues,
  "lookupStatus" | "source" | "name" | "brand" | "size" | "imageUrl"
>;

export type ScanFlowState = {
  step: ScanStep;
  // Steps the back button returns to, oldest first. Its length is the history depth.
  trail: ScanStep[];
  cameraIdle: boolean;
  lookupId: number;
  lookupError: string;
  barcode: ParsedBarcode | null;
  prefill: ProductPrefill | null;
  product: StoreProductDetails | null;
  pendingItems: PendingPullItem[];
};

export type ScanFlowAction =
  | { type: "BARCODE_INVALID" }
  | { type: "TYPE_NUMBER" }
  | { type: "LOOKUP_STARTED"; lookupId: number; barcode: ParsedBarcode }
  | { type: "PRODUCT_KNOWN"; lookupId: number; result: Extract<BarcodeLookupResult, { kind: "known" }> }
  | { type: "PRODUCT_UNKNOWN"; lookupId: number; prefill: ProductPrefill }
  | { type: "LOOKUP_FAILED"; lookupId: number; message: string }
  | { type: "ENTER_MANUALLY" }
  | { type: "PRODUCT_SAVED"; product: StoreProductDetails }
  | { type: "ADD_ANOTHER_DATE" }
  | { type: "BACK"; depth: number }
  | { type: "CAMERA_IDLE" }
  | { type: "RESET" };

export const initialScanFlowState: ScanFlowState = {
  step: "scanning",
  trail: [],
  cameraIdle: false,
  lookupId: 0,
  lookupError: "",
  barcode: null,
  prefill: null,
  product: null,
  pendingItems: [],
};

export const EMPTY_PREFILL: Omit<ProductPrefill, "lookupStatus" | "source"> = {
  name: "",
  brand: "",
  size: "",
  imageUrl: "",
};

function push(state: ScanFlowState, step: ScanStep): ScanFlowState {
  return { ...state, step, trail: [...state.trail, state.step] };
}

function replace(state: ScanFlowState, step: ScanStep): ScanFlowState {
  return { ...state, step };
}

// A lookup answer counts only if the user is still waiting for that same lookup.
function isCurrentLookup(state: ScanFlowState, lookupId: number): boolean {
  return state.step === "looking-up" && state.lookupId === lookupId;
}

export function scanFlowReducer(state: ScanFlowState, action: ScanFlowAction): ScanFlowState {
  switch (action.type) {
    case "BARCODE_INVALID":
      return push(state, "invalid-barcode");
    case "TYPE_NUMBER":
      return push(state, "manual-entry");
    case "LOOKUP_STARTED": {
      const next = { ...state, lookupId: action.lookupId, barcode: action.barcode, lookupError: "" };
      return state.step === "lookup-failed" ? replace(next, "looking-up") : push(next, "looking-up");
    }
    case "PRODUCT_KNOWN": {
      if (!isCurrentLookup(state, action.lookupId)) return state;
      const { product, pendingItems } = action.result;
      const next = { ...state, product, pendingItems };
      return replace(next, pendingItems.length > 0 ? "already-tracked" : "date-form");
    }
    case "PRODUCT_UNKNOWN":
      if (!isCurrentLookup(state, action.lookupId)) return state;
      return replace({ ...state, prefill: action.prefill }, "product-form");
    case "LOOKUP_FAILED":
      if (!isCurrentLookup(state, action.lookupId)) return state;
      return replace({ ...state, lookupError: action.message }, "lookup-failed");
    case "ENTER_MANUALLY":
      return replace(
        { ...state, prefill: { ...EMPTY_PREFILL, lookupStatus: "FAILED", source: null } },
        "product-form",
      );
    case "PRODUCT_SAVED":
      // Replaces the product form, so back can't reopen a form for a saved product.
      return replace({ ...state, product: action.product, pendingItems: [] }, "date-form");
    case "ADD_ANOTHER_DATE":
      return push(state, "date-form");
    case "BACK": {
      if (action.depth >= state.trail.length) return state;
      const step = state.trail[action.depth];
      if (step === "scanning") return initialScanFlowState;
      return { ...state, step, trail: state.trail.slice(0, action.depth) };
    }
    case "CAMERA_IDLE":
      return state.step === "scanning" ? state : { ...state, cameraIdle: true };
    case "RESET":
      return initialScanFlowState;
  }
}
