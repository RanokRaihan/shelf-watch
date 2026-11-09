import { Suspense } from "react";

import { APP_CONTAINER } from "@/components/layout/app-main";
import { LockButton } from "@/components/manage/lock-button";
import { ManageTabLinks, ManageTabs } from "@/components/manage/manage-tabs";
import { countPendingMembers } from "@/lib/members";
import { getSession, hasManagerAccess } from "@/lib/session";
import { cn } from "@/lib/utils";

// Tabs with the pending join requests count on Members. Reads the session
// without guarding (pages guard themselves); no count without manager access.
async function ManageTabsWithBadges() {
  const auth = await getSession();
  const pending =
    auth && hasManagerAccess(auth) ? await countPendingMembers(auth.user.storeId) : 0;
  return <ManageTabs badges={{ "/manage/members": pending }} />;
}

// Second bar under the top bar on manager pages: tabs on the left, Lock on
// the right. No auth check here; each page calls `requireManager()`.
export function ManageNav() {
  return (
    <div className="border-b print:hidden">
      <nav aria-label="Manager" className={cn(APP_CONTAINER, "flex items-center gap-4")}>
        {/* Reads cookies, and usePathname suspends under a dynamic segment (cacheComponents). */}
        <Suspense fallback={<ManageTabLinks pathname={null} />}>
          <ManageTabsWithBadges />
        </Suspense>
        <LockButton />
      </nav>
    </div>
  );
}
