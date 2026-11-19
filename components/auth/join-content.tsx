import { JoinPanel } from "@/components/auth/join-panel";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJoinStore } from "@/lib/auth/join";
import { requireGuest } from "@/lib/auth/session";

// `/join/[token]` (docs/auth-flow.md 4.3). The guard runs before the token is
// checked, so a signed-in phone goes to /pulls and a trusted or pending one
// to /unlock or /pending, even from an old QR. Reads cookies and params, so
// render it inside Suspense (cacheComponents).
export async function JoinContent({ params }: { params: Promise<{ token: string }> }) {
  await requireGuest();

  const { token } = await params;
  const store = await getJoinStore(token);

  if (!store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">This QR code doesn&apos;t work anymore</CardTitle>
          <CardDescription className="text-base">
            Your store may have printed a new one. Ask your manager to show you
            the current QR code, then scan it again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <JoinPanel token={token} storeName={store.name} />;
}

export function JoinSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
