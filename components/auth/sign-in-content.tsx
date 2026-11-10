import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { requireGuest } from "@/lib/auth/session";

// Session goes to /today, trusted device to /unlock, pending to /pending. Render inside Suspense.
export async function SignInContent() {
  await requireGuest();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="text-base text-muted-foreground">
          Sign in with your password to use ShelfWatch on this device.
        </p>
      </div>

      <SignInForm />

      <p className="text-base text-muted-foreground">
        No password? Scan your store&apos;s QR code to sign in on this phone.
      </p>

      <p className="text-center text-base text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Create your store
        </Link>
      </p>
    </>
  );
}

export function SignInSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-72 animate-pulse rounded-md bg-muted" />
      <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
