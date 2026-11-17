"use client";

import { usePathname } from "next/navigation";

import { TabLinks } from "@/components/layout/tab-links";
import type { PullBucket, PullBucketCounts } from "@/lib/pulls/pull-items";
import { cn } from "@/lib/utils";

const tabs: { bucket: PullBucket; href: string; label: string }[] = [
  { bucket: "previous", href: "/pulls/previous", label: "Previous" },
  { bucket: "today", href: "/pulls", label: "Today" },
  { bucket: "upcoming", href: "/pulls/upcoming", label: "Upcoming" },
];

function Count({ count, overdue }: { count: number; overdue: boolean }) {
  return (
    <span className={cn("-ml-1 tabular-nums", overdue && "text-destructive")}>
      ({count > 9 ? "9+" : count})
    </span>
  );
}

// `pathname` null renders none as active and `counts` null hides the counts (Suspense fallback).
export function PullsTabLinks({
  pathname,
  counts,
}: {
  pathname: string | null;
  counts: PullBucketCounts | null;
}) {
  const links = tabs.map(({ bucket, href, label }) => {
    const count = counts?.[bucket] ?? 0;
    return {
      href,
      label,
      exact: true,
      badge: count > 0 ? <Count count={count} overdue={bucket === "previous"} /> : null,
    };
  });
  return <TabLinks tabs={links} pathname={pathname} />;
}

export function PullsTabs({ counts }: { counts: PullBucketCounts | null }) {
  return <PullsTabLinks pathname={usePathname()} counts={counts} />;
}
