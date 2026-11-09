import type { Metadata } from "next";
import { Suspense } from "react";

import {
  ManagerLoginContent,
  ManagerLoginSkeleton,
} from "@/components/manage/manager-login-content";

export const metadata: Metadata = {
  title: "Confirm password | ShelfWatch",
};

// Password screen for manager access (docs/auth-flow.md 4.5).
export default function ManagerLoginPage() {
  return (
    // Guarded by `requireManagerLogin()`; reads cookies, so it sits behind Suspense (cacheComponents).
    <Suspense fallback={<ManagerLoginSkeleton />}>
      <ManagerLoginContent />
    </Suspense>
  );
}
