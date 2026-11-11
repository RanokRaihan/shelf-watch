# ShelfWatch: decisions

Current architecture decisions and why they were made. When a decision changes, edit or replace its entry instead of adding a new one below it, so this file only ever says what is true now. Dates are when the decision was made or last changed.

## Stack and tooling

- 2026-11-02: One Next.js app (App Router, TypeScript, Tailwind). No separate backend.
- 2026-11-02: Prisma is pinned to 7.10.1 (CLI and client). The npm `latest` tag for the `prisma` CLI pointed at 8.0.0-rc, which didn't match `@prisma/client`.
- 2026-11-02: Prisma 7 needs a driver adapter, so `lib/db.ts` uses `@prisma/adapter-pg` + `pg`. The client is cached on `globalThis` in dev to survive hot reloads.
- 2026-11-02: The generated client lives at `app/generated/prisma` (the `prisma init` default). `postinstall` runs `prisma generate`.
- 2026-11-02: shadcn/ui with style `base-nova`, built on `@base-ui/react` (not Radix). Components import `cn` from the `cn` npm package rather than `@/lib/utils`.
- 2026-11-07: Passwords and PINs are hashed with `bcryptjs` (pure JS, cost 12). The 72-character password limit matches bcrypt's.
- 2026-11-08: QR codes come from `qrcode`, which renders an SVG string on the server, so no client JS. Error correction M, margin 4.
- 2026-11-08: Toasts use shadcn `sonner` (`Toaster` in the root layout).

## UI and theme

- 2026-11-05: Dark mode the shadcn way: `next-themes`, `ThemeProvider` in the root layout, default theme `system`. In `app/globals.css` the `dark` variant is `&:is(.dark *)`. `ModeToggle` is one click (no dropdown). `disableTransitionOnChange` is left off on purpose, because it cancels the icon animation.
- 2026-11-05: Neutral theme tokens everywhere, with `primary` as the only accent. No hardcoded colors.
- 2026-11-05: `button` and `input` keep shadcn's stock sizes. Phone-first touch sizes are set per use with `className`.
- 2026-11-08: Pages stay thin; sections live in `components/<feature>/`. The landing page (`app/page.tsx`) and `app/not-found.tsx` still keep their sections inline and haven't been split yet.
- 2026-11-08: Every signed-in user gets the same account dropdown (initials button). "Log out" is for everyone, "Manage store" only for managers. Add future menu pages to its `links` array.
- 2026-11-08: Manager pages with tabs live in the `app/(app)/manage/(tabs)/` route group, whose layout renders `ManageNav` under `AppNav`. `/manage/login` sits outside the group, so it has no tabs. `app/(app)/layout.tsx` doesn't render `main`; pages and nested layouts use `AppMain`, and `APP_CONTAINER` keeps the header, tab bar and content the same width. One responsive layout: tabs scroll sideways on narrow screens, no hamburger or sidebar. The header isn't sticky, so the tab bar isn't either.
- 2026-11-08: The QR and its printed text use fixed black on white instead of theme tokens, so codes stay scannable and print readably in dark mode.

## Server actions and errors

- 2026-11-07: Our own action helpers, no library. Every action returns an `ActionResult` and is built with `createAction`. `lib/` functions throw `AppError` for expected errors; the wrapper converts those and known Prisma errors into failures, logs anything else, and sends the client only a generic `INTERNAL` message. It calls `unstable_rethrow` first so `redirect()` and `notFound()` still work.
- 2026-11-07: With `@prisma/adapter-pg`, a P2002 reports the constraint by name only, as `meta.driverAdapterError.cause.constraint.index` (for example `User_username_key`). `lib/core/errors.ts` parses Prisma's default `<Model>_<fields>_key` index name to find the field. Postgres reports one violation at a time, so a form with both username and email taken shows the username error first.
- 2026-11-07: Server actions live in top-level `actions/`, never in `app/`. Naming is `<feature>.action.ts` and `<feature>.validation.ts`, kebab-case within names.
- 2026-11-08: When an action succeeds and the client should toast, the client navigates (`router.replace`) instead of the action calling `redirect()`, because a redirect drops the action's result and the toast with it.

## Validation

- 2026-11-05: Assumed signup rules until Ranok confirms: 4-digit PIN, password 8 to 72 characters, username 3 to 30 characters, US timezones only. Field names follow the schema, except `storeName` for `Store.name`.
- 2026-11-07: Usernames and emails are lowercase. The schemas trim and lowercase, and `lib/` lowercases again before saving, so the unique indexes are effectively case-insensitive. Sign-in and anything else that looks up a user must lowercase the same way.
- 2026-11-07: Email and password are required for manager signup (in `registerSchema`), though both stay optional in the Prisma schema for associates.
- 2026-11-07: Confirm password and Confirm PIN are `refine`s on the shared schema, each with a `when` so the mismatch shows in the same submit as other errors; the forms also check on blur. Don't add `abort: true` to field checks in a refined schema: an aborted issue makes Zod skip the refine.
- 2026-11-08: Phones are stored as E.164. US numbers only for now (matching the timezone list); `phoneSchema` normalizes common formats with no extra library.

## Auth

`docs/auth-flow.md` is Ranok's design. These are the choices made while building it.

- 2026-11-08: Tokens are 32 random bytes (base64url) in httpOnly, SameSite=Lax cookies; only their sha256 is stored. `Session.id` is the hash. `secure` is set only in production so phones can test over LAN http.
- 2026-11-08: Join link tokens are the one exception to hash-only storage: they're public by design (printed on the wall) and joining needs manager approval. Store links have no expiry; Rotate is how one is turned off. One active link per store is enforced by locking the `Store` row, not by a database constraint.
- 2026-11-08: Routing by auth state uses redirects to separate pages, not conditional rendering. `/` sends a valid session to `/today`, a trusted device to `/unlock` and a pending one to `/pending`; anyone else sees the landing page. `/unlock` and `/pending` never send anyone to `/`, so a revoked device can't loop.
- 2026-11-08: Each page guards itself inside `Suspense`, never in a layout. Mutations check too, because actions can be called without the page. A phone with a trusted or pending device but no session counts as not a guest. No `proxy.ts`: the page checks are what keep content safe, and a cookie-only proxy would only skip the brief skeleton before a redirect.
- 2026-11-08: Signup trusts the manager's phone and starts a session with 15 minutes of manager access in the same transaction as the store.
- 2026-11-08: Log out ends only the session (Session row and `sw_session`); `sw_device` stays, so the user only needs their PIN next time.
- 2026-11-08: PIN unlock submits only on the Unlock button or Enter, never when the boxes fill. Lockout uses existing columns: `failedPinAttempts` keeps counting across locks and resets only on a correct PIN, so `failedPinAttempts / 5` gives the step (1, 5, 15 min). Unlock replaces any old session on the device, so a phone has at most one. A PIN session has no manager access. Everyone lands on `/today` after unlocking.
- 2026-11-08: Manager access needs the MANAGER role plus a password confirmed in the last 15 minutes (`Session.managerUntil`). Lock clears `managerUntil` and goes to `/today`; the PIN session stays. After the password it always returns to `/manage` (no `?next=` until there are more manager pages).
- 2026-11-08: Joining creates a PENDING ASSOCIATE and an unapproved Device in the store found from the token on the server (the form never sends a store id), sets only `sw_device`, and the client goes to `/pending`. A revoked or unknown device can join again, replacing its `sw_device`.
- 2026-11-09: Password sign-in at `/sign-in` is guest-only, so it always creates a new approved Device and replaces `sw_device`; the session starts with manager access. Every failure, locked included, says "Wrong username or password." with no tries-left count, and unknown users are checked against a dummy hash so timing doesn't leak.
- 2026-11-09: Password lockout is split. `/sign-in` uses the User fields (`failedPasswordAttempts`, `passwordLockedUntil`, 1/5/15 min). `/manage/login` counts on `Session.failedPasswordAttempts`, and the 5th wrong password deletes the session (back to the PIN), so nobody outside can lock a manager out of manager access.
- 2026-11-08: The device and entry helpers live in `lib/auth/session.ts` (auth-flow calls it `lib/auth.ts`).

## Members

- 2026-11-08: The invite page is `/manage/members/invite`, under Members (not Settings). The first visit creates the link.
- 2026-11-09: The list is grouped by section (Waiting for approval, Team, Removed) with no status badges. The whole row links to `/manage/members/[id]`. Pending rows have Approve and Reject inline; Approve hides the row before the server answers. Team rows have no actions on the list; they live on the detail page. The Members tab shows the pending count, read with `getSession()` and only with manager access.
- 2026-11-09: No actions on yourself or on other managers until roles are designed. Approve also approves the user's waiting devices. Reject deletes the pending user, their sessions and devices (they own nothing else), which frees the username and phone to join again. Remove follows auth-flow 4.9: DISABLED, sessions deleted, devices revoked, in one transaction.
- 2026-11-09: The detail page's active sessions list filters by the same rules as `getSession()`, because expired or idle rows are only deleted on their next request. Session ids never reach the page. A manager can sign out a session or revoke a phone for anyone in the store except their own current phone. A session is named by its device id, since a phone has at most one session (unlock replaces it). Sign out deletes the session and keeps the phone trusted; Revoke sets `revokedAt` and deletes its sessions in one transaction (4.10). Both need the member to be ACTIVE.

## Data model

- 2026-11-04: `PullEvent` is the record of who changed a pull item; `PullItem` has no `updatedBy`. `PullItem.product` is required, so an unknown UPC needs a bare `Product` row first.
- 2026-11-07: `User.username` is unique across all stores.

## Not built yet

- Restore a removed member, reset PIN, promote, per-device revoke, ending a single session.
- The New phone flow (auth-flow 4.7, existing username + PIN on the join page). A taken username just shows "This username is already taken".
- Password reset by email (auth-flow 4.8), so `/sign-in` has no "Forgot password?" link.
- Rate limiting. Join is open to spam until it's added.
- A PWA manifest. When added, set `start_url` to `/today`.
