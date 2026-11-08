import type { Metadata } from "next";
import { Suspense } from "react";

import { UnlockContent, UnlockSkeleton } from "@/components/auth/unlock-content";
import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
  title: "Unlock | ShelfWatch",
};

// No link to `/` here either; see UnlockContent.
export default function UnlockPage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <span className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </span>
          <ModeToggle />
        </header>

        {/* Reading cookies must sit behind Suspense (cacheComponents). */}
        <Suspense fallback={<UnlockSkeleton />}>
          <UnlockContent />
        </Suspense>
      </div>
    </main>
  );
}
