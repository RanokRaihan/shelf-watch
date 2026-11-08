import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/components/auth/register-form";
import { ModeToggle } from "@/components/mode-toggle";
import { requireGuest } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create your store | ShelfWatch",
};

export default function RegisterPage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-xl lg:max-w-4xl flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex h-12 items-center gap-2 text-lg font-bold"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            ShelfWatch
          </Link>
          <ModeToggle />
        </header>

        {/* Guest only: reads cookies, so it sits behind Suspense (cacheComponents). */}
        <Suspense fallback={<RegisterSkeleton />}>
          <RegisterContent />
        </Suspense>
      </div>
    </main>
  );
}

// Signed-in phones go to /today and trusted or pending devices to /unlock
// before any of the form is rendered.
async function RegisterContent() {
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
          href="/signin"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

function RegisterSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-6 w-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
