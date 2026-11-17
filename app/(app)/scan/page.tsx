import type { Metadata } from "next";
import { Suspense } from "react";

import { AppMain } from "@/components/layout/app-main";
import { ScanContent, ScanSkeleton } from "@/components/scan/scan-content";

export const metadata: Metadata = {
  title: "Scan | ShelfWatch",
};

export default function ScanPage() {
  return (
    <AppMain>
      <Suspense fallback={<ScanSkeleton />}>
        <ScanContent />
      </Suspense>
    </AppMain>
  );
}
