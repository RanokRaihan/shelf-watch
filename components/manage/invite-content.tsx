import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { InviteActions } from "@/components/manage/invite-actions";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { qrSvg } from "@/lib/qr";
import { requireManager } from "@/lib/session";
import { getOrCreateJoinLink } from "@/lib/store-invite";
import { cn } from "@/lib/utils";

// Fits the printed QR, store name and join line on one letter page.
const PRINT_PAGE_CSS = "@page { size: letter portrait; margin: 0.75in; }";

// The store's join QR (docs/auth-flow.md 4.2). Creates the link on the first
// visit. Reads the session, so render it inside Suspense.
export async function InviteContent() {
  const { user } = await requireManager();
  const link = await getOrCreateJoinLink({ storeId: user.storeId, userId: user.id });
  const svg = await qrSvg(link.url);
  const storeName = user.store.name;

  return (
    <>
      <style>{PRINT_PAGE_CSS}</style>

      <div className="flex flex-col gap-2 print:hidden">
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
        <h1 className="text-3xl font-bold tracking-tight">Invite to your store</h1>
        <p className="text-base text-muted-foreground">
          Colleagues scan this code with their phone camera to ask to join. You
          approve each request before they can sign in.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto_1fr] lg:items-start lg:gap-8">
        {/* On paper only this card prints: black on white, centered, large. */}
        <Card className="items-center print:text-black print:shadow-none print:ring-0">
          <CardContent className="flex flex-col items-center gap-4 text-center print:gap-8 print:pt-[0.5in]">
            <div
              role="img"
              aria-label={`QR code to join ${storeName} on ShelfWatch`}
              className="aspect-square w-72 max-w-full sm:w-80 print:w-[5in] [&>svg]:size-full"
              // Generated on the server by `qrcode` from our own URL.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <div className="flex flex-col gap-1 print:gap-4">
              <p className="text-2xl font-bold tracking-tight text-balance print:text-5xl">
                {storeName}
              </p>
              <p className="text-base text-muted-foreground print:hidden">
                Scan to join {storeName} on ShelfWatch
              </p>
              <p className="hidden text-2xl text-balance print:block">
                Point your phone&apos;s camera at this code to join {storeName} on
                ShelfWatch.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="print:hidden">
          <InviteActions url={link.url} />
        </div>
      </div>
    </>
  );
}

export function InviteSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="h-12 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto_1fr] lg:gap-8">
        <div className="mx-auto aspect-square w-80 max-w-full animate-pulse rounded-xl bg-muted lg:mx-0" />
        <div className="flex flex-col gap-3">
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
