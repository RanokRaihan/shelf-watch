import { CloudOff, PencilLine, RotateCcw } from "lucide-react";

import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";

type LookupFailedScreenProps = {
  barcodeValue: string;
  message: string;
  onRetry: () => void;
  onEnterManually: () => void;
  onRescan: () => void;
};

export function LookupFailedScreen({
  barcodeValue,
  message,
  onRetry,
  onEnterManually,
  onRescan,
}: LookupFailedScreenProps) {
  return (
    <ScanScreen
      alert
      icon={<CloudOff className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />}
      title="Couldn't look up this product"
      description={message}
      actions={
        <>
          <Button onClick={onRetry} className={SCREEN_BUTTON_CLASS}>
            <RotateCcw aria-hidden="true" />
            Retry
          </Button>
          <Button variant="outline" onClick={onEnterManually} className={SCREEN_BUTTON_CLASS}>
            <PencilLine aria-hidden="true" />
            Enter manually
          </Button>
          <Button variant="ghost" onClick={onRescan} className={SCREEN_BUTTON_CLASS}>
            Rescan
          </Button>
        </>
      }
    >
      <p className="font-mono text-base tracking-wider">{barcodeValue}</p>
    </ScanScreen>
  );
}
