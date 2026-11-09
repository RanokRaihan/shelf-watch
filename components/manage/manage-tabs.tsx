"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type ManageTab = {
  href: string;
  label: string;
  // Active only on `href` itself, not on its sub-pages.
  exact?: boolean;
};

// Manager tabs, in order. Add a page here (Settings is next).
const tabs: ManageTab[] = [
  { href: "/manage", label: "Overview", exact: true },
  { href: "/manage/members", label: "Members" },
];

function isActive(tab: ManageTab, pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === tab.href) return true;
  return !tab.exact && pathname.startsWith(`${tab.href}/`);
}

// Count shown next to a tab label, keyed by the tab's `href`. Hidden when 0.
export type TabBadges = Partial<Record<string, number>>;

// The tab links. `pathname` null renders none as active (Suspense fallback).
export function ManageTabLinks({
  pathname,
  badges,
}: {
  pathname: string | null;
  badges?: TabBadges;
}) {
  return (
    <ul className="flex min-w-0 flex-1 gap-6 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((tab) => {
        const active = isActive(tab, pathname);
        const count = badges?.[tab.href] ?? 0;
        return (
          <li key={tab.href} className="shrink-0">
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-12 items-center gap-2 border-b-2 text-base font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {count > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
                  {count > 99 ? "99+" : count}
                  <span className="sr-only"> waiting</span>
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ManageTabs({ badges }: { badges?: TabBadges }) {
  return <ManageTabLinks pathname={usePathname()} badges={badges} />;
}
