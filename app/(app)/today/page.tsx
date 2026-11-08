import type { Metadata } from "next";
import { Suspense } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Today | ShelfWatch",
};

// Placeholder for today's pull list. The list comes with the core loop.
export default function TodayPage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <span className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </span>
          <ModeToggle />
        </header>

        {/* Reading the session cookie must sit behind Suspense (cacheComponents). */}
        <Suspense fallback={<TodaySkeleton />}>
          <TodayContent />
        </Suspense>
      </div>
    </main>
  );
}

async function TodayContent() {
  const { user } = await requireSession();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
        <p className="text-base text-muted-foreground">{user.store.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Nothing here yet</CardTitle>
          <CardDescription className="text-base">
            Today&apos;s pull list is coming soon.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
