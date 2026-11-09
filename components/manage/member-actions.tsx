"use client";

import { Check, MoreHorizontal, UserMinus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  approveMemberAction,
  rejectMemberAction,
  removeMemberAction,
} from "@/actions/members.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActionResult } from "@/lib/action-result";

type MemberActionsProps = {
  userId: string;
  name: string;
  kind: "pending" | "active";
  // Where to go after the member leaves this view (rejected from the detail
  // page). Without it the current page refreshes.
  redirectTo?: string;
};

type Confirm = "reject" | "remove";

const itemClass = "h-11 gap-3 px-3 text-base";

const confirmCopy = {
  reject: {
    title: (name: string) => `Reject ${name}'s request?`,
    description:
      "Their join request is deleted. If it was a mistake, they can scan the store QR code and ask again.",
    action: "Reject",
    pending: "Rejecting…",
  },
  remove: {
    title: (name: string) => `Remove ${name}?`,
    description:
      "They're signed out right away and their phones stop working with ShelfWatch. Their past scans stay.",
    action: "Remove",
    pending: "Removing…",
  },
} as const;

// The ⋯ menu on a member row and the detail page. Pending: Approve / Reject.
// Active: Remove. Reject and Remove confirm first. Hiding the menu is only for
// looks: the server checks the role, store and status itself.
export function MemberActions({
  userId,
  name,
  kind,
  redirectTo,
}: MemberActionsProps) {
  const router = useRouter();
  // `confirm` is kept after closing so the dialog text stays during the close animation.
  const [confirm, setConfirm] = useState<Confirm>("remove");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isApproving, startApprove] = useTransition();
  const [isConfirming, startConfirm] = useTransition();
  const busy = isApproving || isConfirming;

  // Shared result handling. No result: manager access ran out and the action
  // redirected to the password screen.
  function finish(
    result: ActionResult<{ name: string }> | undefined,
    leaves: boolean,
  ) {
    if (!result) return false;
    if (!result.ok) {
      toast.error(result.error.message);
      // Someone else may have handled it already; show the current state.
      router.refresh();
      return false;
    }
    toast.success(result.message);
    if (leaves && redirectTo) router.replace(redirectTo);
    else router.refresh();
    return true;
  }

  function onApprove() {
    startApprove(async () => {
      finish(await approveMemberAction({ userId }), false);
    });
  }

  function onConfirm() {
    startConfirm(async () => {
      const result =
        confirm === "reject"
          ? await rejectMemberAction({ userId })
          : await removeMemberAction({ userId });
      // A rejected user no longer exists, so the detail page has to go.
      if (finish(result, confirm === "reject")) setDialogOpen(false);
    });
  }

  const copy = confirmCopy[confirm];

  function openConfirm(next: Confirm) {
    setConfirm(next);
    setDialogOpen(true);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="size-11 shrink-0"
              aria-label={`Actions for ${name}`}
              disabled={busy}
            />
          }
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {kind === "pending" ? (
            <>
              <DropdownMenuItem
                className={itemClass}
                disabled={busy}
                // Stay open so "Approving…" shows until the result.
                closeOnClick={false}
                onClick={onApprove}
              >
                <Check aria-hidden="true" className="size-5" />
                {isApproving ? "Approving…" : "Approve"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClass}
                variant="destructive"
                disabled={busy}
                onClick={() => openConfirm("reject")}
              >
                <X aria-hidden="true" className="size-5" />
                Reject
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              className={itemClass}
              variant="destructive"
              disabled={busy}
              onClick={() => openConfirm("remove")}
            >
              <UserMinus aria-hidden="true" className="size-5" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(next) => !isConfirming && setDialogOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {copy.title(name)}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {copy.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="h-12 text-base"
              disabled={isConfirming}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-12 text-base"
              disabled={isConfirming}
              onClick={onConfirm}
            >
              {isConfirming ? copy.pending : copy.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
