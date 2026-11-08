import { requireManager } from "@/lib/session";

// Placeholder manager home content. `requireManager()` sends colleagues to
// /today and managers without recent password access to /manage/login.
// Reads the session, so render it inside Suspense.
export async function ManageWelcome() {
  const { user } = await requireManager();

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="text-base text-muted-foreground">
        You&apos;re the manager of {user.store.name}.
      </p>
    </div>
  );
}

export function ManageWelcomeSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
