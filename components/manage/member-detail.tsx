import { ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { UserStatus } from "@/app/generated/prisma/client";
import { MemberActions } from "@/components/manage/member-actions";
import { MemberAvatar, roleLabel, StatusPill } from "@/components/manage/member-row";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMember, memberActionKind, type MemberDetail as Member } from "@/lib/members";
import { formatPhone } from "@/lib/phone";
import { requireManager } from "@/lib/session";
import { cn } from "@/lib/utils";

type Device = Member["devices"][number];

function deviceState(device: Device): { status: UserStatus; label: string } {
  if (device.revokedAt) return { status: "DISABLED", label: "Revoked" };
  if (!device.approvedAt) return { status: "PENDING", label: "Waiting" };
  return { status: "ACTIVE", label: "Active" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-base break-words">{children}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/manage/members"
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "-ml-3 h-12 self-start gap-2 px-3 text-base",
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      Members
    </Link>
  );
}

// `/manage/members/[id]`: one member's details and devices, with the same ⋯
// actions as the list. Only members of the manager's own store are found;
// anything else is a 404. Reads cookies and params, so render it inside Suspense.
export async function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireManager();
  const { id } = await params;
  const member = await getMember(user.storeId, id);
  if (!member) notFound();

  const isYou = member.id === user.id;
  const kind = memberActionKind(user.id, member);
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: user.store.timezone,
  });
  const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: user.store.timezone,
  });

  return (
    <>
      <div className="flex flex-col gap-4">
        <BackLink />
        <div className="flex items-center gap-4">
          <MemberAvatar name={member.name} className="size-14 text-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {member.name}
              {isYou ? (
                <span className="font-normal text-muted-foreground"> (you)</span>
              ) : null}
            </h1>
            <div className="flex items-center gap-2">
              <StatusPill status={member.status} />
              <span className="text-sm text-muted-foreground">{roleLabel(member.role)}</span>
            </div>
          </div>
          {kind ? (
            <MemberActions
              userId={member.id}
              name={member.name}
              kind={kind}
              redirectTo="/manage/members"
            />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Username">@{member.username}</Field>
            <Field label="Role">{roleLabel(member.role)}</Field>
            <Field label="Phone">
              <a href={`tel:${member.phone}`} className="underline-offset-4 hover:underline">
                {formatPhone(member.phone)}
              </a>
            </Field>
            {member.email ? <Field label="Email">{member.email}</Field> : null}
            <Field label="Joined">{dateFormat.format(member.createdAt)}</Field>
            <Field label="Approved">
              {member.approvedAt ? dateFormat.format(member.approvedAt) : "Not yet"}
            </Field>
          </dl>
        </CardContent>
      </Card>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Phones</CardTitle>
        </CardHeader>
        {member.devices.length === 0 ? (
          <CardContent className="pb-4">
            <p className="text-base text-muted-foreground">No phones set up.</p>
          </CardContent>
        ) : (
          <ul className="divide-y border-t">
            {member.devices.map((device) => {
              const state = deviceState(device);
              return (
                <li key={device.id} className="flex items-center gap-3 px-4 py-3">
                  <Smartphone aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-base font-medium">{device.label ?? "Phone"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      Added {dateFormat.format(device.createdAt)}
                      {device.lastSeenAt
                        ? ` · Last seen ${dateTimeFormat.format(device.lastSeenAt)}`
                        : null}
                    </p>
                  </div>
                  <StatusPill status={state.status} label={state.label} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

export function MemberDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-4">
        <div className="h-12 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center gap-4">
          <div className="size-14 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
