import { Suspense } from "react";

import { AppMain } from "@/components/layout/app-main";
import { PullsGreeting, PullsGreetingSkeleton } from "@/components/pulls/pulls-greeting";
import { PullsNav } from "@/components/pulls/pulls-nav";
import { ScanLink } from "@/components/pulls/scan-link";

// Greeting and tabs shared by the pull list pages. Auth is checked in each page, not here.
export default function PullsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppMain>
      <Suspense fallback={<PullsGreetingSkeleton />}>
        <PullsGreeting />
      </Suspense>
      <ScanLink />
      <div className="flex flex-col gap-4">
        <PullsNav />
        {children}
      </div>
    </AppMain>
  );
}
