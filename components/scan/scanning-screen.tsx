import { ArrowLeft, Keyboard } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SCREEN_BUTTON_CLASS } from "@/components/scan/scan-screen";
import { Button, buttonVariants } from "@/components/ui/button";

/** Stays mounted (hidden) on the other steps so the camera stream keeps running. */
export function ScanningScreen({
  hidden,
  onTypeNumber,
  children,
}: {
  hidden: boolean;
  onTypeNumber: () => void;
  children: ReactNode;
}) {
  return (
    <div hidden={hidden} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Scan</h1>
        <p className="text-base text-muted-foreground">
          Scan a product barcode to set its pull date.
        </p>
      </div>
      {children}
      <div className="flex flex-col gap-3">
        <Button variant="outline" onClick={onTypeNumber} className={SCREEN_BUTTON_CLASS}>
          <Keyboard aria-hidden="true" />
          Type the number
        </Button>
        <Link href="/today" className={buttonVariants({ variant: "ghost", className: SCREEN_BUTTON_CLASS })}>
          <ArrowLeft aria-hidden="true" />
          Back to today
        </Link>
      </div>
    </div>
  );
}
