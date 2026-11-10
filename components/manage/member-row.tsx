import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Role, UserStatus } from "@/app/generated/prisma/client";
import { initials } from "@/lib/format/initials";
import type { MemberSummary } from "@/lib/store/members";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  MANAGER: "Manager",
  MODERATOR: "Moderator",
  ASSOCIATE: "Associate",
};

export function roleLabel(role: Role): string {
  return roleLabels[role];
}

// Small muted role label; Manager gets the primary tint so it stands out.
export function RoleLabel({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs font-medium",
        role === "MANAGER" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {roleLabel(role)}
    </span>
  );
}

const statusStyles: Record<UserStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-primary/10 text-primary" },
  ACTIVE: { label: "Active", className: "bg-secondary text-secondary-foreground" },
  DISABLED: { label: "Removed", className: "bg-muted text-muted-foreground" },
};

// Status pill for the detail page. A plain span with theme tokens (no shadcn
// badge, since `components/ui/` only gets new components when Ranok asks).
export function StatusPill({ status, label }: { status: UserStatus; label?: string }) {
  const style = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium",
        style.className,
      )}
    >
      {label ?? style.label}
    </span>
  );
}

export function MemberAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function memberHref(id: string): string {
  return `/manage/members/${id}`;
}

// Classes for a row whose whole area opens the member: the name link's
// `::after` covers the row (put the `li` in `relative`). Anything clickable
// inside the row needs `relative z-10` to sit above it.
export const ROW_CLASS = "relative transition-colors hover:bg-muted/50";
export const ROW_LINK_CLASS =
  "outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset";

export function RowChevron() {
  return <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />;
}

// A Team or Removed row: avatar, name (with "(you)"), @username and role.
// The whole row links to the member's detail page.
export function MemberRow({ member, actorId }: { member: MemberSummary; actorId: string }) {
  const isYou = member.id === actorId;
  const removed = member.status === "DISABLED";

  return (
    <li className={cn(ROW_CLASS, "flex min-h-12 items-center gap-3 px-4 py-3")}>
      <MemberAvatar name={member.name} className={removed ? "opacity-60" : undefined} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={memberHref(member.id)}
          className={cn(ROW_LINK_CLASS, "truncate text-base font-medium")}
        >
          {member.name}
          {isYou ? <span className="font-normal text-muted-foreground"> (you)</span> : null}
        </Link>
        <p className="truncate text-sm text-muted-foreground">@{member.username}</p>
      </div>
      <RoleLabel role={member.role} />
      <RowChevron />
    </li>
  );
}
