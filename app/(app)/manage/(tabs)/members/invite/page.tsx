import type { Metadata } from "next";
import { Suspense } from "react";

import { InviteContent, InviteSkeleton } from "@/components/manage/invite-content";

export const metadata: Metadata = {
  title: "Invite | ShelfWatch",
};

// Under /manage/members, so the Members tab stays active.
export default function InvitePage() {
  return (
    // Guarded by `requireManager()`; reads cookies, so it sits behind Suspense (cacheComponents).
    <Suspense fallback={<InviteSkeleton />}>
      <InviteContent />
    </Suspense>
  );
}
