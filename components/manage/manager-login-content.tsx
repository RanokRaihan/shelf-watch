import { ManagerLoginForm } from "@/components/manage/manager-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireManagerLogin } from "@/lib/auth/session";

// Only a signed-in manager without current manager access gets here: no
// session goes to /unlock, colleagues to /today, and a manager who already
// has access to /manage. Render it inside Suspense (cacheComponents).
export async function ManagerLoginContent() {
  await requireManagerLogin();

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Confirm your password</CardTitle>
        <CardDescription className="text-base">
          Manager tools need your password. You&apos;ll stay unlocked for 15
          minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ManagerLoginForm />
        {/* Email reset (auth-flow 4.8) isn't built yet. */}
        <p className="text-sm text-muted-foreground">
          Forgot your password? Password reset by email is coming soon.
        </p>
      </CardContent>
    </Card>
  );
}

export function ManagerLoginSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl bg-card p-6"
    >
      <div className="h-7 w-52 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
