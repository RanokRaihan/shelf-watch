import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PinForm } from "@/components/auth/pin-form";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDevice, getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Unlock | ShelfWatch",
};

// PIN screen (docs/auth-flow.md 4.4), plus the pending and unknown-device
// states. Never links or redirects to `/`: `/` sends trusted devices here, and
// a revoked device must not bounce between the two.
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

async function UnlockContent() {
  if (await getSession()) redirect("/today");

  const device = await getDevice();

  if (device.state === "trusted") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hi, {device.user.name}</CardTitle>
          <CardDescription className="text-base">
            Enter your PIN to open {device.store.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PinForm />
        </CardContent>
      </Card>
    );
  }

  if (device.state === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Waiting for manager approval</CardTitle>
          <CardDescription className="text-base">
            A manager at {device.store.name} needs to approve this phone. Open
            the app again once they have.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Scan your store&apos;s QR code
        </CardTitle>
        <CardDescription className="text-base">
          This phone isn&apos;t set up for a store. Ask your manager to show
          you the store&apos;s QR code, then scan it with your camera.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">
          Starting a new store?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function UnlockSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
