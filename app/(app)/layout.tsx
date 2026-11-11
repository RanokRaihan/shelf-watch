import { AppNav } from "@/components/layout/app-nav";

// Shell for signed-in pages (`/today`, `/manage/*`). Pages (or nested
// layouts) add their own `AppMain`, so a bar like the manager tabs can sit
// between the top bar and the content. Auth is checked in each page, not here.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <AppNav />
      {children}
    </div>
  );
}
