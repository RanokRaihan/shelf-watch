import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";

// Placeholder for today's pull list. The list comes with the core loop.
// Reads the session, so render it inside Suspense (cacheComponents).
export async function TodayContent() {
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

export function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
