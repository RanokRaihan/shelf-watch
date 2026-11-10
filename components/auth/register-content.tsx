import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { requireGuest } from "@/lib/session";

// Signed-in phones go to /today and trusted or pending devices to /unlock
// before any of the form is rendered. Render it inside Suspense
// (cacheComponents).
export async function RegisterContent() {
  await requireGuest();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Create your store
        </h1>
        <p className="text-base text-muted-foreground">
          Set up your store and your manager account.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export function RegisterSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
