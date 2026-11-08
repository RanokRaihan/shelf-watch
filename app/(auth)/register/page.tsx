import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RegisterContent, RegisterSkeleton } from "@/components/auth/register-content";
import { ModeToggle } from "@/components/mode-toggle";

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
