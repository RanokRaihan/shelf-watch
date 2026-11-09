import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireManager } from "@/lib/session";

// Placeholder members page. Reads the session, so render it inside Suspense.
export async function MembersContent() {
  await requireManager();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        {/* Does nothing yet; invites come next. */}
        <Button type="button" className="h-12 text-base">
          <Plus aria-hidden="true" className="size-5" />
          Invite
        </Button>
      </div>
      <p className="text-base text-muted-foreground">
        Your team and pending invites will show up here.
      </p>
    </>
  );
}

export function MembersSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-12 w-28 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-6 w-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
