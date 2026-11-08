import type { Metadata } from "next";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Unlock | ShelfWatch",
};

// Stub. The real PIN screen comes with docs/auth-flow.md 4.4.
export default function UnlockPage() {
  return (
    <main className="flex-1 bg-muted/40">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex h-12 items-center text-lg font-bold">
            ShelfWatch
          </Link>
          <ModeToggle />
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your session ended</CardTitle>
            <CardDescription className="text-base">
              PIN sign-in is coming soon.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              href="/"
              className={buttonVariants({ className: "h-12 w-full text-base" })}
            >
              Go to home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
