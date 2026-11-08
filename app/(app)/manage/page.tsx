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
        <Suspense fallback={<WelcomeSkeleton />}>
          <Welcome />
        </Suspense>
      </div>
    </main>
  );
}

async function Welcome() {
  const { user } = await requireSession();

  if (user.role !== "MANAGER") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Managers only</CardTitle>
          <CardDescription className="text-base">
            This page is for store managers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="text-base text-muted-foreground">
        You&apos;re the manager of {user.store.name}.
      </p>
    </div>
  );
}

function WelcomeSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
