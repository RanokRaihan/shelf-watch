import type { Metadata } from "next";
import { Suspense } from "react";

import { PendingContent, PendingSkeleton } from "@/components/auth/pending-content";
import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
  title: "Waiting for approval | ShelfWatch",
};

// Same shell as /unlock. No link to `/`; see PendingContent.
export default function PendingPage() {
  return (
    <main className="flex flex-1 flex-col bg-muted/40">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <span className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </span>
          <ModeToggle />
        </header>

        <div className="flex flex-1 flex-col justify-center pb-[10vh]">
          {/* Reading cookies must sit behind Suspense (cacheComponents). */}
          <Suspense fallback={<PendingSkeleton />}>
            <PendingContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
