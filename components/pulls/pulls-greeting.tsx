import { getSession } from "@/lib/auth/session";
import { greetingFor, hourIn, randomLine } from "@/lib/format/greeting";

// Rendered by the layout, so it doesn't guard; each page calls `requireSession()`.
export async function PullsGreeting() {
  const auth = await getSession();
  if (!auth) return <PullsGreetingSkeleton />;
  const { user } = auth;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-base text-muted-foreground">{greetingFor(hourIn(user.store.timezone))},</p>
      <h1 className="text-3xl font-bold tracking-tight break-words">{user.name}</h1>
      <p className="text-base text-muted-foreground">{randomLine()}</p>
    </div>
  );
}

export function PullsGreetingSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
