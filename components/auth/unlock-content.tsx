import Link from "next/link";
import { redirect } from "next/navigation";

import { PinForm } from "@/components/auth/pin-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDevice, getSession } from "@/lib/session";

// PIN screen (docs/auth-flow.md 4.4), plus the pending and unknown-device
// states. Never links or redirects to `/`: `/` sends trusted devices here, and
// a revoked device must not bounce between the two. Reads cookies, so render it
// inside Suspense (cacheComponents).
export async function UnlockContent() {
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

export function UnlockSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
