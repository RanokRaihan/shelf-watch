"use client";

import { Lock } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { managerLockAction } from "@/actions/manager-lock.action";
import { Button } from "@/components/ui/button";

// Ends manager access on this phone and goes to /today. The label is hidden
// on small screens; the icon and aria-label stay.
export function LockButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-12 min-w-12 shrink-0 gap-2 px-3 text-base"
      aria-label="Lock manager access"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await managerLockAction();
          if (result && !result.ok) toast.error(result.error.message);
        })
      }
    >
      <Lock aria-hidden="true" className="size-5" />
      <span className="hidden sm:inline">{isPending ? "Locking…" : "Lock"}</span>
    </Button>
  );
}
