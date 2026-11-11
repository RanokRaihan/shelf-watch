import type { Metadata } from "next";
import { Suspense } from "react";

import { MembersContent, MembersSkeleton } from "@/components/manage/members-content";

export const metadata: Metadata = {
  title: "Members | ShelfWatch",
};

export default function MembersPage() {
  return (
    // Guarded by `requireManager()`; reads cookies, so it sits behind Suspense (cacheComponents).
    <Suspense fallback={<MembersSkeleton />}>
      <MembersContent />
    </Suspense>
  );
}
