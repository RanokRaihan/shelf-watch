import { LogoutButton } from "@/components/auth/logout-button";
import { ModeToggle } from "@/components/mode-toggle";

// Top bar for signed-in pages. Static: no session read here, so it stays in
// the static shell. Each page checks the session itself.
export function AppNav() {
  return (
    <header className="border-b bg-background">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-xl items-center justify-between px-5 lg:max-w-3xl"
      >
        <span className="inline-flex h-14 items-center text-lg font-bold">
          ShelfWatch
        </span>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
