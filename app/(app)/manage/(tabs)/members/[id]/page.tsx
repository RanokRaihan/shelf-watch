import type { Metadata } from "next";
import { Suspense } from "react";

import { MemberDetail, MemberDetailSkeleton } from "@/components/manage/member-detail";

export const metadata: Metadata = {
  title: "Member | ShelfWatch",
};

// Under /manage/members, so the Members tab stays active. The static `invite`
// segment wins over `[id]`.
export default function MemberPage({ params }: PageProps<"/manage/members/[id]">) {
  return (
    // Guarded by `requireManager()`; reads cookies and params, so it sits behind Suspense (cacheComponents).
    <Suspense fallback={<MemberDetailSkeleton />}>
      <MemberDetail params={params} />
    </Suspense>
  );
}
