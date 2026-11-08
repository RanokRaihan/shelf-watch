"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { logoutAction } from "@/actions/logout.action";
import { Button } from "@/components/ui/button";

// Ends the session; the action redirects to /unlock. Only a failure comes back.
export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-12 gap-2 px-3 text-base"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await logoutAction();
          if (result && !result.ok) toast.error(result.error.message);
        })
      }
    >
      <LogOut aria-hidden="true" className="size-5" />
      {isPending ? "Logging out…" : "Log out"}
    </Button>
  );
}
