import { cn } from "@/lib/utils";

// Width and side padding shared by the top bar, the manager tab bar and the
// page content, so everything lines up under the logo.
export const APP_CONTAINER = "mx-auto w-full max-w-xl px-5 lg:max-w-3xl";

// Main content area for signed-in pages.
export function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <main className={cn(APP_CONTAINER, "flex flex-1 flex-col gap-6 py-6 sm:py-10")}>
      {children}
    </main>
  );
}
