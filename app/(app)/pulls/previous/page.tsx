import type { Metadata } from "next";
import { Suspense } from "react";

import { PullsSection, PullsSectionSkeleton } from "@/components/pulls/pulls-section";

export const metadata: Metadata = {
  title: "Previous pulls | ShelfWatch",
};

export default function PreviousPullsPage() {
  return (
    <Suspense fallback={<PullsSectionSkeleton />}>
      <PullsSection bucket="previous" />
    </Suspense>
  );
}
