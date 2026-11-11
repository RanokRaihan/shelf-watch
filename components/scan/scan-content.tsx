import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";

// Placeholder until the scanner is built.
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Scanner coming soon</CardTitle>
          <CardDescription className="text-base">
            This is where the camera will open.
          </CardDescription>
        </CardHeader>
      </Card>
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
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
