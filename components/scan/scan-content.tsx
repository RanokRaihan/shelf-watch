import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BarcodeScanner } from "@/components/scan/barcode-scanner";
import { buttonVariants } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/session";

export async function ScanContent() {
  await requireSession();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Scan</h1>
        <p className="text-base text-muted-foreground">
          Scan a product barcode to set its pull date.
        </p>
      </div>
      <BarcodeScanner />
      <Link
        href="/today"
        className={buttonVariants({
          variant: "outline",
          className: "h-12 w-full gap-2 text-base",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Back to today
      </Link>
    </>
  );
}

export function ScanSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="aspect-4/3 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
