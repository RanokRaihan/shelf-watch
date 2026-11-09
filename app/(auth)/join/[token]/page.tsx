import type { Metadata } from "next";
import { Suspense } from "react";

import { JoinContent, JoinSkeleton } from "@/components/auth/join-content";
import { ModeToggle } from "@/components/mode-toggle";

export const metadata: Metadata = {
  title: "Join your store | ShelfWatch",
};

export default function JoinPage({ params }: PageProps<"/join/[token]">) {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <span className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </span>
          <ModeToggle />
        </header>

        {/* Guest only and reads params, so it sits behind Suspense (cacheComponents). */}
        <Suspense fallback={<JoinSkeleton />}>
          <JoinContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}
