import type { Metadata } from "next";
import { Suspense } from "react";

import { PullsSection, PullsSectionSkeleton } from "@/components/pulls/pulls-section";

export const metadata: Metadata = {
  title: "Upcoming pulls | ShelfWatch",
};

export default function UpcomingPullsPage() {
  return (
    <Suspense fallback={<PullsSectionSkeleton />}>
      <PullsSection bucket="upcoming" />
    </Suspense>
  );
}
