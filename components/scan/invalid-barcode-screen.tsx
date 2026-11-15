import { Keyboard, ScanBarcode, TriangleAlert } from "lucide-react";

import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";

export function InvalidBarcodeScreen({
  onRescan,
  onTypeNumber,
}: {
  onRescan: () => void;
  onTypeNumber: () => void;
}) {
  return (
    <ScanScreen
      alert
      icon={<TriangleAlert className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />}
      title="Couldn't read that barcode"
      description="Scan it again, or type the number printed under the bars."
      actions={
        <>
          <Button onClick={onRescan} className={SCREEN_BUTTON_CLASS}>
            <ScanBarcode aria-hidden="true" />
            Rescan
          </Button>
          <Button variant="outline" onClick={onTypeNumber} className={SCREEN_BUTTON_CLASS}>
            <Keyboard aria-hidden="true" />
            Type the number
          </Button>
        </>
      }
    />
  );
}
