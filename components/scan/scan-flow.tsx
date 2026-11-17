"use client";

import { useCallback, useReducer } from "react";
import { toast } from "sonner";

import { BarcodeScanner } from "@/components/scan/barcode-scanner";
import { initialScanFlowState, scanFlowReducer } from "@/components/scan/scan-flow-reducer";
import { ScanStepScreen, type ScanStepHandlers } from "@/components/scan/scan-step-screen";
import { ScanningScreen } from "@/components/scan/scanning-screen";
import { useBarcodeLookup } from "@/components/scan/use-barcode-lookup";
import { useIdleTimer } from "@/components/scan/use-idle-timer";
import { useScanHistory } from "@/components/scan/use-scan-history";
import { parseBarcode, type BarcodeFormat } from "@/lib/barcode/gtin";
import { formatDay } from "@/lib/format/calendar-day";

const CAMERA_IDLE_MS = 60_000;

export function ScanFlow({ timezone }: { timezone: string }) {
  const [state, dispatch] = useReducer(scanFlowReducer, initialScanFlowState);
  const lookUp = useBarcodeLookup(dispatch);
  const scanning = state.step === "scanning";

  useScanHistory(state.step, state.trail.length, dispatch);
  useIdleTimer(!scanning && !state.cameraIdle, CAMERA_IDLE_MS, () =>
    dispatch({ type: "CAMERA_IDLE" }),
  );

  const handleDetected = useCallback(
    (code: string, format: BarcodeFormat | undefined) => {
      const parsed = parseBarcode(code, format);
      if (parsed.ok) void lookUp(parsed.barcode);
      else dispatch({ type: "BARCODE_INVALID" });
    },
    [lookUp],
  );

  const rescan = () => dispatch({ type: "RESET" });
  const typeNumber = () => dispatch({ type: "TYPE_NUMBER" });

  const handlers: ScanStepHandlers = {
    rescan,
    typeNumber,
    lookUp: (barcode) => void lookUp(barcode),
    retryLookup: () => {
      if (state.barcode) void lookUp(state.barcode);
    },
    enterManually: () => dispatch({ type: "ENTER_MANUALLY" }),
    productSaved: (product) => dispatch({ type: "PRODUCT_SAVED", product }),
    addAnotherDate: () => dispatch({ type: "ADD_ANOTHER_DATE" }),
    pullItemSaved: ({ productName, pullDate }) => {
      toast.success("Pull date saved", {
        description: `${productName}: pull on ${formatDay(pullDate)}`,
      });
      rescan();
    },
  };

  return (
    <>
      <ScanningScreen hidden={!scanning} onTypeNumber={typeNumber}>
        <BarcodeScanner
          streamEnabled={!state.cameraIdle}
          detecting={scanning}
          onDetected={handleDetected}
        />
      </ScanningScreen>
      <ScanStepScreen state={state} timezone={timezone} handlers={handlers} />
    </>
  );
}
