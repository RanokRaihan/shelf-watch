"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { endMemberSessionAction, revokeMemberDeviceAction } from "@/actions/members.action";
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

type DeviceActionKind = "sign-out" | "revoke";

type DeviceActionButtonProps = {
  userId: string;
  deviceId: string;
  name: string;
  deviceLabel: string | null;
  kind: DeviceActionKind;
};

const copy = {
  "sign-out": {
    button: "Sign out",
    title: (name: string, label: string) => `Sign ${name} out of ${label}?`,
    description: () => "They'll need their PIN to get back in. The phone stays trusted.",
    pending: "Signing out…",
    action: endMemberSessionAction,
  },
  revoke: {
    button: "Revoke",
    title: (_name: string, label: string) => `Revoke ${label}?`,
    description: (name: string) =>
      `${name} is signed out right away and this phone stops working with ShelfWatch. To use it again, they'd need to set it up from scratch.`,
    pending: "Revoking…",
    action: revokeMemberDeviceAction,
  },
} as const;

// Sign out / Revoke on a session or phone row of the member detail page.
// Confirms first; the server checks the role, store and device itself.
export function DeviceActionButton({
  userId,
  deviceId,
  name,
  deviceLabel,
  kind,
}: DeviceActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const text = copy[kind];
  const label = deviceLabel ?? "this phone";

  function onConfirm() {
    startTransition(async () => {
      const result = await text.action({ userId, deviceId });
      // No result: manager access ran out and the action redirected.
      if (!result) return;
      if (!result.ok) {
        toast.error(result.error.message);
        router.refresh();
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={kind === "revoke" ? "destructive" : "outline"}
        className="h-10 shrink-0 px-3 text-base"
        disabled={isPending}
        onClick={() => setOpen(true)}
      >
        {text.button}
      </Button>

      <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">{text.title(name, label)}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {text.description(name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base" disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-12 text-base"
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? text.pending : text.button}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
