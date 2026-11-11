import { UserMenuDropdown } from "@/components/layout/user-menu-dropdown";
import { getSession } from "@/lib/auth/session";

// The account menu in `AppNav`. Reads the session but doesn't guard: each page
// does its own `requireSession()`. Renders nothing without a session. Render
// it inside Suspense (cacheComponents).
export async function UserMenu() {
  const auth = await getSession();
  if (!auth) return null;

  return (
    <UserMenuDropdown
      name={auth.user.name}
      storeName={auth.user.store.name}
      isManager={auth.user.role === "MANAGER"}
    />
  );
}

export function UserMenuSkeleton() {
  return (
    <div aria-hidden="true" className="size-10 animate-pulse rounded-full bg-muted" />
  );
}
