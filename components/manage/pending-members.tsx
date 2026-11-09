"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { approveMemberAction, rejectMemberAction } from "@/actions/members.action";
import {
  MemberAvatar,
  memberHref,
  ROW_CLASS,
  ROW_LINK_CLASS,
  RowChevron,
} from "@/components/manage/member-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type PendingMember = {
  id: string;
  name: string;
  username: string;
  // Already formatted on the server ("5 min ago").
  requestedAgo: string;
};

const BUTTON_CLASS = "h-11 text-base sm:h-9 sm:text-sm";

function PendingRow({
  member,
  onHide,
  onShow,
}: {
  member: PendingMember;
  onHide: (id: string) => void;
  onShow: (id: string) => void;
}) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const busy = isApproving || isRejecting;

  function onApprove() {
    // Leave the list right away; put the row back if the server says no.
    onHide(member.id);
    startApprove(async () => {
      const result = await approveMemberAction({ userId: member.id });
      // No result: manager access ran out and the action redirected.
      if (!result) return;
      if (!result.ok) {
        onShow(member.id);
        toast.error(result.error.message);
      } else {
        toast.success(result.message);
      }
      router.refresh();
    });
  }

  function onReject() {
    startReject(async () => {
      const result = await rejectMemberAction({ userId: member.id });
      if (!result) return;
      if (!result.ok) {
        toast.error(result.error.message);
        router.refresh();
        return;
      }
      setRejectOpen(false);
      onHide(member.id);
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <li className={cn(ROW_CLASS, "flex min-h-12 flex-wrap items-center gap-3 px-4 py-3")}>
      <MemberAvatar name={member.name} className="bg-background" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={memberHref(member.id)}
          className={cn(ROW_LINK_CLASS, "truncate text-base font-medium")}
        >
          {member.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          @{member.username} · {member.requestedAgo}
        </p>
      </div>

      {/* Under the name on phones (full width, side by side), inline from `sm`. */}
      <div className="relative z-10 order-last grid w-full grid-cols-2 gap-2 sm:order-none sm:flex sm:w-auto">
        <Button type="button" className={BUTTON_CLASS} disabled={busy} onClick={onApprove}>
          {isApproving ? "Approving…" : "Approve"}
        </Button>
        <AlertDialog
          open={rejectOpen}
          onOpenChange={(next) => !isRejecting && setRejectOpen(next)}
        >
          <AlertDialogTrigger
            render={<Button type="button" variant="outline" className={BUTTON_CLASS} />}
            disabled={busy}
          >
            Reject
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">
                Reject {member.name}&apos;s request?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Their request is deleted and their phone can&apos;t sign in. If
                it was a mistake, they can scan the store QR code and ask again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-12 text-base" disabled={isRejecting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="h-12 text-base"
                disabled={isRejecting}
                onClick={onReject}
              >
                {isRejecting ? "Rejecting…" : "Reject"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <RowChevron />
    </li>
  );
}

// "Waiting for approval": one tinted card with Approve and Reject on each
// row. Approved or rejected rows disappear at once; `router.refresh()` then
// brings the server's list (and the tab badge) up to date. Renders nothing
// once the list is empty.
export function PendingMembers({ members }: { members: PendingMember[] }) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const visible = members.filter((m) => !hidden.has(m.id));

  function onHide(id: string) {
    setHidden((prev) => new Set(prev).add(id));
  }
  function onShow(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="members-pending" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="members-pending" className="text-lg font-semibold">
          Waiting for approval{" "}
          <span className="font-normal text-muted-foreground">({visible.length})</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          They scanned your store&apos;s QR code. Approve them so they can sign in.
        </p>
      </div>
      <Card className="bg-primary/5 py-0 ring-primary/30">
        <ul className="divide-y divide-primary/15">
          {visible.map((member) => (
            <PendingRow key={member.id} member={member} onHide={onHide} onShow={onShow} />
          ))}
        </ul>
      </Card>
    </section>
  );
}
