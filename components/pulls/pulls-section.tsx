import { PullList } from "@/components/pulls/pull-list";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { barcodeSvg } from "@/lib/barcode/barcode-svg";
import { listPullItems, type PullBucket } from "@/lib/pulls/pull-items";

const emptyCopy: Record<PullBucket, { title: string; description: string }> = {
  previous: { title: "Nothing overdue", description: "Every past pull date has been handled." },
  today: { title: "Nothing to pull today", description: "Scan a product to set its pull date." },
  upcoming: { title: "Nothing coming up", description: "No pull dates after today yet." },
};

// The page guard. Reads the session and the time, so render it inside Suspense.
export async function PullsSection({ bucket }: { bucket: PullBucket }) {
  const { user } = await requireSession();
  const rows = await listPullItems(user.storeId, user.store.timezone, bucket);
  // Rendered here so no barcode code ships to the client.
  const items = rows.map((item) => ({
    ...item,
    barcodeSvg: barcodeSvg(item.barcodeFormat, item.barcodeValue),
  }));
  const copy = emptyCopy[bucket];

  return (
    <PullList
      items={items}
      actionable={bucket !== "upcoming"}
      empty={
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{copy.title}</CardTitle>
            <CardDescription className="text-base">{copy.description}</CardDescription>
          </CardHeader>
        </Card>
      }
    />
  );
}

export function PullsSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="h-96 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-96 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
