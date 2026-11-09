"use client";

import { Check, Copy, Printer, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { rotateJoinLinkAction } from "@/actions/store-invite.action";
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

// `navigator.clipboard` only exists on https or localhost. Phones testing
// over LAN http fall back to the old copy command.
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("copy failed");
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await copyText(url);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  return (
    <Button type="button" className="h-12 gap-2 text-base" onClick={onCopy}>
      {copied ? (
        <Check aria-hidden="true" className="size-5" />
      ) : (
        <Copy aria-hidden="true" className="size-5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function RotateLinkButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onRotate() {
    startTransition(async () => {
      const result = await rotateJoinLinkAction();
      // No result: manager access ran out and the action redirected.
      if (!result) return;
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      setOpen(false);
      toast.success("New join link ready. Print or show the new code.");
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" className="h-12 gap-2 text-base" />}
      >
        <RefreshCw aria-hidden="true" className="size-5" />
        Rotate link
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Rotate the join link?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            The current QR code stops working right away, including printed
            copies. You&apos;ll need to print or show the new one. People who
            already joined aren&apos;t affected.
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
            onClick={onRotate}
          >
            {isPending ? "Rotating…" : "Rotate link"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Join URL with Copy, then Print and Rotate. Full-width buttons, stacked at
// the bottom of the screen on phones so they're in reach of a thumb.
export function InviteActions({ url }: { url: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Join link</p>
      <p className="rounded-lg bg-muted px-3 py-3 font-mono text-sm break-all select-all">
        {url}
      </p>
      <CopyLinkButton url={url} />
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 gap-2 text-base"
          onClick={() => window.print()}
        >
          <Printer aria-hidden="true" className="size-5" />
          Print
        </Button>
        <RotateLinkButton />
      </div>
    </div>
  );
}
