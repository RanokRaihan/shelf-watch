import type { Metadata } from "next";
import { Suspense } from "react";

import {
  ManageWelcome,
  ManageWelcomeSkeleton,
} from "@/components/manage/manage-welcome";

export const metadata: Metadata = {
  title: "Manage | ShelfWatch",
};

// Placeholder manager home. The dashboard comes later.
export default function ManagePage() {
  return (
    // Guarded by `requireManager()`; reads cookies, so it sits behind Suspense (cacheComponents).
    <Suspense fallback={<ManageWelcomeSkeleton />}>
      <ManageWelcome />
    </Suspense>
  );
}
