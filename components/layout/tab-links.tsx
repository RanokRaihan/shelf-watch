import Link from "next/link";

import { cn } from "@/lib/utils";

export type TabLink = {
  href: string;
  label: string;
  // Active only on `href` itself, not on its sub-pages.
  exact?: boolean;
  badge?: React.ReactNode;
};

function isActive(tab: TabLink, pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === tab.href) return true;
  return !tab.exact && pathname.startsWith(`${tab.href}/`);
}

// Underlined tab links. `pathname` null renders none as active (Suspense fallback).
export function TabLinks({
  tabs,
  pathname,
  className,
}: {
  tabs: TabLink[];
  pathname: string | null;
  className?: string;
}) {
  return (
    <ul className={cn("flex min-w-0 gap-6 overflow-x-auto [scrollbar-width:none]", className)}>
      {tabs.map((tab) => {
        const active = isActive(tab, pathname);
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
              {tab.badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
