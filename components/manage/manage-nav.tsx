import { Suspense } from "react";

import { APP_CONTAINER } from "@/components/layout/app-main";
import { LockButton } from "@/components/manage/lock-button";
import { ManageTabLinks, ManageTabs } from "@/components/manage/manage-tabs";
import { cn } from "@/lib/utils";

// Second bar under the top bar on manager pages: tabs on the left, Lock on
// the right. No auth check here; each page calls `requireManager()`.
export function ManageNav() {
  return (
    <div className="border-b">
      <nav aria-label="Manager" className={cn(APP_CONTAINER, "flex items-center gap-4")}>
        {/* usePathname suspends under a dynamic segment (cacheComponents). */}
        <Suspense fallback={<ManageTabLinks pathname={null} />}>
          <ManageTabs />
        </Suspense>
        <LockButton />
      </nav>
    </div>
  );
}
