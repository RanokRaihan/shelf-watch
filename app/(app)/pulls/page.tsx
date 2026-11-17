import type { Metadata } from "next";
import { Suspense } from "react";

import { PullsSection, PullsSectionSkeleton } from "@/components/pulls/pulls-section";

export const metadata: Metadata = {
  title: "Today | ShelfWatch",
};

export default function TodayPullsPage() {
  return (
    <Suspense fallback={<PullsSectionSkeleton />}>
      <PullsSection bucket="today" />
    </Suspense>
  );
}
