"use client";

import { LayoutDashboard, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { logoutAction } from "@/actions/logout.action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/initials";

type UserMenuDropdownProps = {
  name: string;
  storeName: string;
  isManager: boolean;
};

type NavLink = {
  href: "/manage";
  label: string;
  icon: LucideIcon;
  managerOnly?: boolean;
};

// Page links in the menu. Add an entry here for a new page; `managerOnly`
// hides it from colleagues. Hiding is only for looks: each page checks the
// role itself.
const links: NavLink[] = [
  { href: "/manage", label: "Manage store", icon: LayoutDashboard, managerOnly: true },
];

const itemClass = "h-11 gap-3 px-3 text-base";

export function UserMenuDropdown({ name, storeName, isManager }: UserMenuDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const visible = links.filter((link) => isManager || !link.managerOnly);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {initials(name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-base font-semibold text-foreground">{name}</span>
            <span className="text-sm font-normal">{storeName}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {visible.length > 0 ? (
          <>
            <DropdownMenuGroup>
              {visible.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} className={itemClass} render={<Link href={href} />}>
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuItem
          className={itemClass}
          disabled={isPending}
          // Keep the menu open so "Logging out…" shows until the redirect.
          closeOnClick={false}
          onClick={() =>
            startTransition(async () => {
              const result = await logoutAction();
              if (result && !result.ok) toast.error(result.error.message);
            })
          }
        >
          <LogOut aria-hidden="true" className="size-5" />
          {isPending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
