import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDevice, getSession } from "@/lib/session";

// `/pending`: a joined colleague waiting for approval (docs/auth-flow.md 4.3
// step 5). Only pending devices stay; everyone else goes to /today or
// /unlock, which handles trusted, revoked and unknown phones. Never sends
// anyone to `/`. Reads cookies, so render it inside Suspense (cacheComponents).
export async function PendingContent() {
  if (await getSession()) redirect("/today");

  const device = await getDevice();
  if (device.state !== "pending") redirect("/unlock");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Waiting for manager approval</CardTitle>
        <CardDescription className="text-base">
          Thanks, {device.user.name}. A manager at {device.store.name} needs to
          approve you. Once they have, open the app again and enter your PIN.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* /unlock shows the PIN screen once approved, or sends back here. */}
        <Link
          href="/unlock"
          className={buttonVariants({
            variant: "outline",
            className: "h-12 w-full text-base",
          })}
        >
          Check again
        </Link>
      </CardContent>
    </Card>
  );
}

export function PendingSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-xl bg-card p-6">
      <div className="h-7 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
      <div className="mt-3 h-12 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
