import { LoaderCircle } from "lucide-react";

import { SCREEN_BUTTON_CLASS, ScanScreen } from "@/components/scan/scan-screen";
import { Button } from "@/components/ui/button";

export function LookingUpScreen({
  barcodeValue,
  onCancel,
}: {
  barcodeValue: string;
  onCancel: () => void;
}) {
  return (
    <ScanScreen
      icon={
        <LoaderCircle
          className="mb-2 size-8 animate-spin text-muted-foreground motion-reduce:animate-none"
          aria-hidden="true"
        />
      }
      title="Looking up product…"
      description={<span className="font-mono tracking-wider">{barcodeValue}</span>}
      actions={
        <Button variant="outline" onClick={onCancel} className={SCREEN_BUTTON_CLASS}>
          Cancel
        </Button>
      }
    />
  );
}
