import { ScanFlow } from "@/components/scan/scan-flow";
import { requireSession } from "@/lib/auth/session";

export async function ScanContent() {
  const { user } = await requireSession();
  return <ScanFlow timezone={user.store.timezone} />;
}

export function ScanSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="aspect-4/3 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
