import Link from "next/link";
import { Suspense } from "react";

import { UserMenu, UserMenuSkeleton } from "@/components/layout/user-menu";
import { ModeToggle } from "@/components/mode-toggle";

// Top bar for signed-in pages. The shell is static; only the account menu
// reads the session, inside Suspense. Each page still checks the session itself.
export function AppNav() {
  return (
    <header className="border-b bg-background">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-xl items-center justify-between px-5 lg:max-w-3xl"
      >
        <Link href="/today" className="inline-flex h-14 items-center text-lg font-bold">
          ShelfWatch
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
