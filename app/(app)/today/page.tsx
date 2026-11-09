import type { Metadata } from "next";
import { Suspense } from "react";

import { AppMain } from "@/components/layout/app-main";
import { TodayContent, TodaySkeleton } from "@/components/today/today-content";

export const metadata: Metadata = {
  title: "Today | ShelfWatch",
};

export default function TodayPage() {
  return (
    // Reads the session cookie, so it sits behind Suspense (cacheComponents).
    <AppMain>
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent />
      </Suspense>
    </AppMain>
  );
}
