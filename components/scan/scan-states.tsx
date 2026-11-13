import { CameraOff, RotateCcw, ScanBarcode } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type CameraProblemKind = "denied" | "no-camera" | "in-use" | "unsupported" | "error";

const PROBLEMS: Record<CameraProblemKind, { title: string; description: string }> = {
  denied: {
    title: "Camera access is blocked",
    description: "ShelfWatch needs the camera to scan barcodes.",
  },
  "no-camera": {
    title: "No camera found",
    description: "This device doesn't seem to have a camera we can use.",
  },
  "in-use": {
    title: "Camera is busy",
    description: "Another app or tab is using the camera. Close it, then try again.",
  },
  unsupported: {
    title: "Camera not available",
    description:
      "This browser can't open the camera here. Open ShelfWatch over HTTPS in an up-to-date browser.",
  },
  error: {
    title: "Couldn't start the camera",
    description: "Something went wrong opening the camera. Try again.",
  },
};

export function CameraProblem({
  kind,
  onRetry,
}: {
  kind: CameraProblemKind;
  onRetry: () => void;
}) {
  const { title, description } = PROBLEMS[kind];

  return (
    <Card role="alert">
      <CardHeader>
        <CameraOff className="mb-2 size-8 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      {kind === "denied" && (
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-base text-muted-foreground">
            <li>Tap the camera or settings icon in the address bar, or open this site&apos;s settings.</li>
            <li>Set Camera to Allow.</li>
            <li>Come back and tap Try again.</li>
          </ol>
        </CardContent>
      )}
      <CardFooter>
        <Button onClick={onRetry} className="h-12 w-full gap-2 text-base">
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ScanResult({ code, onScanAgain }: { code: string; onScanAgain: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-base">Scanned barcode</CardDescription>
        <CardTitle
          className="font-mono text-4xl tracking-wider break-all"
          aria-live="polite"
        >
          {code}
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <Button onClick={onScanAgain} className="h-12 w-full gap-2 text-base">
          <ScanBarcode aria-hidden="true" />
          Scan again
        </Button>
      </CardFooter>
    </Card>
  );
}
