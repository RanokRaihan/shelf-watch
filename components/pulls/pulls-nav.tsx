import { Suspense } from "react";

import { PullsTabLinks, PullsTabs } from "@/components/pulls/pulls-tab-links";
import { getSession } from "@/lib/auth/session";
import { countPullBuckets } from "@/lib/pulls/pull-items";
import { todayIn } from "@/lib/pulls/pull-dates";

// Rendered by the layout, so it doesn't guard; each page calls `requireSession()`.
async function PullsTabsWithCounts() {
  const auth = await getSession();
  const counts = auth
    ? await countPullBuckets(auth.user.storeId, todayIn(auth.user.store.timezone))
    : null;
  return <PullsTabs counts={counts} />;
}

export function PullsNav() {
  return (
    <nav aria-label="Pull list" className="border-b">
      {/* Reads cookies and the time, and usePathname (cacheComponents). */}
      <Suspense fallback={<PullsTabLinks pathname={null} counts={null} />}>
        <PullsTabsWithCounts />
      </Suspense>
    </nav>
  );
}
