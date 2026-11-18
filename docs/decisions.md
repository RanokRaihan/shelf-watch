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
- 2026-11-13: The date picker is the shadcn base Calendar + Popover, added with the shadcn CLI, which brought `react-day-picker` and `date-fns`. `date-fns` also does the pull-date math. Today in the store's timezone comes from `Intl.DateTimeFormat`, no extra timezone package.

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
- 2026-11-08: Routing by auth state uses redirects to separate pages, not conditional rendering. `/` sends a valid session to `/pulls`, a trusted device to `/unlock` and a pending one to `/pending`; anyone else sees the landing page. `/unlock` and `/pending` never send anyone to `/`, so a revoked device can't loop.
- 2026-11-08: Each page guards itself inside `Suspense`, never in a layout. Mutations check too, because actions can be called without the page. A phone with a trusted or pending device but no session counts as not a guest. No `proxy.ts`: the page checks are what keep content safe, and a cookie-only proxy would only skip the brief skeleton before a redirect.
- 2026-11-08: Signup trusts the manager's phone and starts a session with 15 minutes of manager access in the same transaction as the store.
- 2026-11-08: Log out ends only the session (Session row and `sw_session`); `sw_device` stays, so the user only needs their PIN next time.
- 2026-11-08: PIN unlock submits only on the Unlock button or Enter, never when the boxes fill. Lockout uses existing columns: `failedPinAttempts` keeps counting across locks and resets only on a correct PIN, so `failedPinAttempts / 5` gives the step (1, 5, 15 min). Unlock replaces any old session on the device, so a phone has at most one. A PIN session has no manager access. Everyone lands on `/pulls` after unlocking.
- 2026-11-08: Manager access needs the MANAGER role plus a password confirmed in the last 15 minutes (`Session.managerUntil`). Lock clears `managerUntil` and goes to `/pulls`; the PIN session stays. After the password it always returns to `/manage` (no `?next=` until there are more manager pages).
- 2026-11-08: Joining creates a PENDING ASSOCIATE and an unapproved Device in the store found from the token on the server (the form never sends a store id), sets only `sw_device`, and the client goes to `/pending`. A revoked or unknown device can join again, replacing its `sw_device`.
- 2026-11-09: Password sign-in at `/sign-in` is guest-only, so it always creates a new approved Device and replaces `sw_device`; the session starts with manager access. Every failure, locked included, says "Wrong username or password." with no tries-left count, and unknown users are checked against a dummy hash so timing doesn't leak.
- 2026-11-09: Password lockout is split. `/sign-in` uses the User fields (`failedPasswordAttempts`, `passwordLockedUntil`, 1/5/15 min). `/manage/login` counts on `Session.failedPasswordAttempts`, and the 5th wrong password deletes the session (back to the PIN), so nobody outside can lock a manager out of manager access.
- 2026-11-08: The device and entry helpers live in `lib/auth/session.ts` (auth-flow calls it `lib/auth.ts`).

## Members

- 2026-11-08: The invite page is `/manage/members/invite`, under Members (not Settings). The first visit creates the link.
- 2026-11-09: The list is grouped by section (Waiting for approval, Team, Removed) with no status badges. The whole row links to `/manage/members/[id]`. Pending rows have Approve and Reject inline; Approve hides the row before the server answers. Team rows have no actions on the list; they live on the detail page. The Members tab shows the pending count, read with `getSession()` and only with manager access.
- 2026-11-09: No actions on yourself or on other managers until roles are designed. Approve also approves the user's waiting devices. Reject deletes the pending user, their sessions and devices (they own nothing else), which frees the username and phone to join again. Remove follows auth-flow 4.9: DISABLED, sessions deleted, devices revoked, in one transaction.
- 2026-11-09: The detail page's active sessions list filters by the same rules as `getSession()`, because expired or idle rows are only deleted on their next request. Session ids never reach the page. A manager can sign out a session or revoke a phone for anyone in the store except their own current phone. A session is named by its device id, since a phone has at most one session (unlock replaces it). Sign out deletes the session and keeps the phone trusted; Revoke sets `revokedAt` and deletes its sessions in one transaction (4.10). Both need the member to be ACTIVE.

## Scanner

- 2026-11-12: Barcodes are read with `barcode-detector`: the native `BarcodeDetector` when it supports our formats (Chrome on Android), otherwise its ZXing WASM ponyfill, loaded only when `/scan` opens. The `.wasm` is self-hosted (copied to `public/` on `postinstall`) instead of the default jsDelivr CDN, so it always matches the installed version.
- 2026-11-12: Only retail formats (EAN-13, EAN-8, UPC-A, UPC-E). Each frame is cropped to the aiming box (plus a small margin) before detection, so only a barcode the user lines up counts.
- 2026-11-12: A code is accepted only after 3 identical reads, each within 500 ms of the last (frames every 100 ms). A partly covered barcode passes the single check digit about 1 time in 10 and gives a different wrong number each frame, so one read isn't enough. Checkout scanners do the same.
- 2026-11-12: The success beep is a Web Audio tone, no audio file; vibration where supported. The camera frame and scrim are fixed black, like the QR exception.
- 2026-11-13: The camera stream and barcode detection are separate (`use-camera-stream`, `use-barcode-detection`). Detection runs only on the scanning step. The stream stays on through the scan, form, scan loop (the video stays mounted, hidden) so the next scan is instant. It stops when the tab is hidden, after 60 s with no activity on another screen, and when the user leaves `/scan`; it restarts on the scanning step.
- 2026-11-12: A denied camera can't be re-prompted by the page. The denied panel explains how to allow it in site settings, Try again re-requests it, and where the Permissions API reports changes (Chrome) it restarts on its own.

## Scan flow

- 2026-11-13: One page at `/scan`; a reducer (`scan-flow-reducer.ts`) holds the step and swaps the whole screen (no drawer: date pickers and the phone keyboard get cramped in one). Refresh starts over at the scanner; nothing is persisted.
- 2026-11-13: Each step change pushes a history entry (`?step=…`, with `scanDepth` in `history.state`, which Next keeps). Back pops one step; Cancel and Rescan go back to depth 0 with `history.go()` so history doesn't grow. The looking-up step and a saved product form are replaced, not pushed, so back never reopens them.
- 2026-11-13: Lookup order: our `Product` by GTIN first (no API call when found; the `StoreProduct` is created then), then the providers in `lib/products/lookup/` (Open Food Facts for now) with one 5 s timeout. Nothing is saved until the product form. Provider text is clipped to our limits and images are allowed only from `PRODUCT_IMAGE_HOSTS` (shared with `next.config.ts`).
- 2026-11-13: The flow only creates products. Saving upserts with an empty update, so if another user saved the same GTIN first their row stays and we continue with it. `lookupStatus` records how it was made: FOUND (+ `source`) from an API match, NOT_FOUND when the APIs had nothing, FAILED when entered after an error. `sourceData` stays null.
- 2026-11-13: Dates are plain `YYYY-MM-DD` strings end to end and stored as `@db.Date` (UTC midnight). Today is the store's today. The same Zod schema (`pullItemFieldsSchema(today)`) runs in the form and again in `createPullItem`, which builds it with the store's today from the session. An exact pending duplicate (same product, expiry and pull date) is refused. Saving writes the location back to `StoreProduct` and a `PullEvent` CREATED.
- 2026-11-13: Offsets are 1 week, 2 weeks, 1 month, 2 months (calendar months, so Mar 31 minus 1 month is Feb 28). The preselected offset comes from `StoreProduct.leadDays ?? Store.defaultLeadDays`: 7, 14, 30/31 and 60/61 match; anything else preselects nothing. An offset that lands before today sets today and says so.
- 2026-11-13: Typed barcode numbers have no format: 12 digits is UPC-A, 13 EAN-13, 8 UPC-E when it starts with 0/1 and passes the UPC-E check, else EAN-8. "Type the number" is also offered under the camera, for damaged barcodes or a blocked camera.

## Pull list

- 2026-11-16: The signed-in home is `/pulls` (was `/today`), with tabs as separate routes: `/pulls` (Today), `/pulls/previous`, `/pulls/upcoming`. They share `app/(app)/pulls/layout.tsx` (greeting, Scan product, tabs) so URLs, back and refresh work and each list loads only when opened. The layout reads `getSession()` without guarding; each page guards in `PullsSection`.
- 2026-11-16: Buckets are PENDING items by pull date against the store's today: before (Previous), equal (Today), after (Upcoming). Tab counts show in brackets, capped at `9+`; Previous's count uses `text-destructive`. The greeting hour also uses the store's timezone.
- 2026-11-16: Pulled and Skip are offered on Previous and Today only; `markPullItem` also refuses anything due after today. The card hides right away and the toast offers Undo, which puts the item back to PENDING and writes a `PullEvent` EDITED. No confirm dialog, to keep shelf walks fast. The actions call `refresh()` so the tab counts update.
- 2026-11-16: The card shows the real barcode, rendered on the server with `bwip-js` (pinned 4.11.4) from `barcodeFormat` + `barcodeValue`, so no barcode code ships to the client. It's an SVG string (~6 to 11 KB, digits drawn as paths), fixed black on white like the QR, sized by height so UPC-E and UPC-A bars match. If bwip rejects a value, the digits show as text instead. The product image shows only from `PRODUCT_IMAGE_HOSTS`, with a placeholder icon otherwise. "More details" (closed by default) holds category (`StoreProduct.categoryName ?? Product.category`), item number, who added the item and the store-local day they added it.
- 2026-11-16: The tab underline markup is shared by Manage and Pulls in `components/layout/tab-links.tsx`.

## Data model

- 2026-11-04: `PullEvent` is the record of who changed a pull item; `PullItem` has no `updatedBy`. `PullItem.product` is required, so an unknown code still gets a `Product` row (`lookupStatus: NOT_FOUND`).
- 2026-11-13: Products are keyed by `gtin` (14 digits, zero-padded), so the UPC-A, EAN-13 and expanded UPC-E of one item share a row and one API lookup. `barcodeFormat` + `barcodeValue` keep the exact scanned barcode for reprinting. `Product` is shared by all stores and holds only lookup data; a store's own name, SKU, location and `leadDays` (overrides `Store.defaultLeadDays`) live on `StoreProduct`. A product already in our database is never looked up again, whatever its `lookupStatus`.
- 2026-11-07: `User.username` is unique across all stores.

## Not built yet

- Restore a removed member, reset PIN, promote, per-device revoke, ending a single session.
- The New phone flow (auth-flow 4.7, existing username + PIN on the join page). A taken username just shows "This username is already taken".
- Password reset by email (auth-flow 4.8), so `/sign-in` has no "Forgot password?" link.
- Rate limiting. Join is open to spam until it's added.
- A PWA manifest. When added, set `start_url` to `/pulls`.
