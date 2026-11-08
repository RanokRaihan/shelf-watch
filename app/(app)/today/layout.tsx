import { AppNav } from "@/components/layout/app-nav";

// Shell only. Auth is checked in the page, not here.
export default function TodayLayout({ children }: LayoutProps<"/today">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <AppNav />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6 sm:py-10 lg:max-w-3xl">
        {children}
      </main>
    </div>
  );
}
