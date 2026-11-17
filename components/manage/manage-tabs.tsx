"use client";

import { usePathname } from "next/navigation";

import { TabLinks, type TabLink } from "@/components/layout/tab-links";

// Manager tabs, in order. Add a page here (Settings is next).
const tabs: TabLink[] = [
  { href: "/manage", label: "Overview", exact: true },
  { href: "/manage/members", label: "Members" },
];

// Count shown next to a tab label, keyed by the tab's `href`. Hidden when 0.
export type TabBadges = Partial<Record<string, number>>;

function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> waiting</span>
    </span>
  );
}

// The tab links. `pathname` null renders none as active (Suspense fallback).
export function ManageTabLinks({
  pathname,
  badges,
}: {
  pathname: string | null;
  badges?: TabBadges;
}) {
  const withBadges = tabs.map((tab) => {
    const count = badges?.[tab.href] ?? 0;
    return count > 0 ? { ...tab, badge: <CountBadge count={count} /> } : tab;
  });
  return <TabLinks tabs={withBadges} pathname={pathname} className="flex-1" />;
}

export function ManageTabs({ badges }: { badges?: TabBadges }) {
  return <ManageTabLinks pathname={usePathname()} badges={badges} />;
}
