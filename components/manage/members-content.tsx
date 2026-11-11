import { Plus } from "lucide-react";
import Link from "next/link";

import { MemberRow } from "@/components/manage/member-row";
import { PendingMembers } from "@/components/manage/pending-members";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listMembers, type MemberSummary } from "@/lib/store/members";
import { timeAgo } from "@/lib/format/relative-time";
import { requireManager } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function MemberSection({
  title,
  description,
  members,
  actorId,
}: {
  title: string;
  description?: string;
  members: MemberSummary[];
  actorId: string;
}) {
  const id = `members-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-lg font-semibold">
          {title} <span className="font-normal text-muted-foreground">({members.length})</span>
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Card className="py-0">
        <ul className="divide-y">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} actorId={actorId} />
          ))}
        </ul>
      </Card>
    </section>
  );
}

// Everyone in the manager's store, grouped by status. Reads the session, so
// render it inside Suspense.
export async function MembersContent() {
  const { user } = await requireManager();
  const { pending, active, removed } = await listMembers(user.storeId);
  const now = new Date();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Members</h1>
        <Link
          href="/manage/members/invite"
          className={cn(buttonVariants({ size: "lg" }), "h-10 gap-1.5 px-3")}
        >
          <Plus aria-hidden="true" className="size-4" />
          Invite
        </Link>
      </div>

      {/* Renders nothing when no one is waiting. */}
      <PendingMembers
        members={pending.map((m) => ({
          id: m.id,
          name: m.name,
          username: m.username,
          requestedAgo: timeAgo(m.createdAt, now),
        }))}
      />

      {/* Never empty: the manager is in it. */}
      <MemberSection title="Team" members={active} actorId={user.id} />

      {removed.length > 0 ? (
        <MemberSection
          title="Removed"
          description="They can't sign in anymore."
          members={removed}
          actorId={user.id}
        />
      ) : null}
    </>
  );
}

export function MembersSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex flex-col divide-y rounded-xl ring-1 ring-foreground/10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="size-10 animate-pulse rounded-full bg-muted" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
