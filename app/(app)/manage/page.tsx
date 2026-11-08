import type { Metadata } from "next";
import { Suspense } from "react";

import {
  ManageWelcome,
  ManageWelcomeSkeleton,
} from "@/components/manage/manage-welcome";
import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
  title: "Manage | ShelfWatch",
};

// Placeholder manager home. The dashboard comes later.
export default function ManagePage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-xl lg:max-w-4xl flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <span className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </span>
          <ModeToggle />
        </header>

        {/* Reading the session cookie must sit behind Suspense (cacheComponents). */}
        <Suspense fallback={<ManageWelcomeSkeleton />}>
          <ManageWelcome />
        </Suspense>
      </div>
    </main>
  );
}
