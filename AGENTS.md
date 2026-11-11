<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShelfWatch: agent notes

Barcode-scan tool for retail teams to track product pull dates. This file holds only what the code doesn't tell you. Read the code for what each file does.

## Keeping this file lean

- Update this file only when a command, rule, the folder layout, or a gotcha changes. Don't list files or describe what a component renders; that's what the code is for.
- Record architecture decisions in `docs/decisions.md`. When one changes, edit or replace its entry instead of appending, so it only says what's true now.
- Aim to keep this file around 150 lines. If a section grows, move the detail to `docs/` and link it.
- Don't use Markdown tables here; formatters pad them to huge widths.

## Commands

- `npm run dev` (dev server), `npm run build`, `npm run lint`. There's no test script.
- `npm install` runs `prisma generate` (`postinstall`). The Prisma CLI config is `prisma7.config.ts` (schema and migrations paths, `DATABASE_URL` via dotenv).
- Don't run migrations. Ranok runs them, or approves a one-time exception.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind) with `cacheComponents` and `partialPrefetching` on. One app, no separate backend.
- Prisma 7.10.1 (pinned) with the `@prisma/adapter-pg` driver adapter, on Postgres. The generated client is in `app/generated/prisma/` (gitignored).
- shadcn/ui, style `base-nova`, built on `@base-ui/react`, not Radix. Toasts with `sonner`, forms with `@tanstack/react-form` + `zod`, hashing with `bcryptjs`, QR with `qrcode`, themes with `next-themes`.
- `.env`: `DATABASE_URL`, and optional `APP_URL` (public origin for join links; set it in production). See `.env.example`.

## Docs

- `docs/auth-flow.md`: Ranok's auth design (PIN, password, devices, sessions, manager access, user flows). Read it before touching auth. If the code and the doc disagree, ask.
- `docs/decisions.md`: current architecture decisions and why.
- `node_modules/next/dist/docs/`: the Next.js guides for this version.

## Scope

- Core loop (scan, set pull date, today's list) plus auth as described in `docs/auth-flow.md`.
- No notifications or analytics until Ranok says so.
- Never create or change the Prisma schema (`prisma/schema.prisma`); Ranok owns it.

## Folder layout

- `app/`: routes only. `(auth)/` holds guest and entry pages (`/register`, `/sign-in`, `/join/[token]`, `/unlock`, `/pending`); `(app)/` holds signed-in pages (`/today`, `/scan`, `/manage/*`). Manager pages with the tab bar are in `(app)/manage/(tabs)/`; `/manage/login` sits outside it.
- `actions/`: server actions, one `"use server"` file per feature, named `<feature>.action.ts`. Never inside `app/`.
- `components/<feature>/` (`auth/`, `today/`, `scan/`, `manage/`): page sections, guards and skeletons. `components/layout/`: shared app chrome. `components/ui/`: shadcn components.
- `lib/`: all database and business logic, as plain functions.
  - `db.ts` (the single Prisma client; don't create another) and `utils.ts` (shadcn `cn`) stay at the root.
  - `core/`: action plumbing and app-wide server helpers (`action-result`, `safe-action`, `errors`, `app-url`).
  - `auth/`: auth, sessions, devices and secrets. `store/`: store management (members, invites, QR). `format/`: pure display helpers, safe on client and server. `validations/`: Zod schemas, named `<feature>.validation.ts`.
  - A new feature gets its own folder (for example `lib/pulls/pull-items.ts`).
  - Import with the full path (`@/lib/auth/session`). No barrel `index.ts` files.

## Rules

- Server actions and route handlers only call `lib/` functions. No Prisma calls in components or actions.
- File names: kebab-case base name plus a dot role suffix (`store-invite.action.ts`). Don't use `_` (a leading `_` marks a private folder in `app/`).
- Keep `page.tsx` and `layout.tsx` thin: metadata, the page shell, `Suspense` boundaries, and composing components. A section's skeleton is exported from the same file as the section.
- Use shadcn components and theme tokens (`bg-background`, `bg-muted`, `bg-primary`, `text-muted-foreground`, …). No hardcoded colors, and `primary` is the only accent. Exception: the QR code and its printed text are fixed black on white so they stay scannable.
- `components/ui/` has only `button`, `input`, `label`, `card`, `separator`, `field`, `select`, `sonner`, `dropdown-menu`, `alert-dialog`. Add more only when asked.
- `button` and `input` keep shadcn's stock sizes (button `h-8`, `sm` `h-7`, `lg` `h-9`; input `h-8`). Set phone-first touch sizes where they're used with `className` (`h-12 text-base`).
- Don't change theme colors or radius in `app/globals.css`; Ranok sets those.
- Comments: only when the code isn't clear on its own, one short line. No multi-line or block comments.
- Every server action is built with `createAction` (`lib/core/safe-action.ts`) and returns an `ActionResult`. `lib/` functions throw `AppError` for expected errors.
- Usernames and emails are stored lowercase. Reuse `usernameSchema` and `phoneSchema` (US only, normalized to E.164) wherever a username or phone is entered, and lowercase emails before lookup.
- Every auth form has `method="post"`, so a submit before hydration never puts a PIN or password in the URL.

## Page protection

Every page calls its own guard from `lib/auth/session.ts` in a `Suspense` child that wraps its content, never in a layout.

- Private pages (`/today`, `/scan`): `requireSession()`. No session goes to `/unlock`.
- Manager pages (`/manage/*`): `requireManager()`. Colleagues go to `/today`; managers without recent password access go to `/manage/login`.
- `/manage/login`: `requireManagerLogin()`. A manager who already has access goes to `/manage`.
- Guest-only pages (`/register`, `/sign-in`, `/join/[token]`): `requireGuest()`. A session goes to `/today`, a trusted device to `/unlock`, a pending one to `/pending`.
- Entry pages: `/` (`getEntryRoute()`), `/unlock` and `/pending`. They never send anyone to `/`, so a revoked device can't loop.
- Mutations check too, since actions can be called without the page: guest-only ones call `assertGuest()`, private ones `getSession()` / `requireSession()`, manager ones `requireManager()`.
- Hiding a link (like "Manage store" in the user menu) is cosmetic. The page guard is what protects it.

## Gotchas

### Next.js

- With `cacheComponents`, anything that reads cookies, the time, or `usePathname` must sit inside `Suspense`. A function that reads the time without cookies may need `await connection()` first (see `getJoinStore()`), or a cookie-less prerender runs it at build time.
- A `redirect()` inside a streamed `Suspense` boundary arrives as a client-side meta refresh.
- A `redirect()` in a server action drops the action's result. When the client should toast on success, return the result and navigate on the client with `router.replace()`.
- `createAction` calls `unstable_rethrow` first so `redirect()` and `notFound()` still work inside actions. Keep it that way.
- Route params are passed down unawaited and awaited inside the `Suspense` boundary.
- LAN testing needs `allowedDevOrigins: ["192.168.*.*"]` in `next.config.ts`. Without it the page never hydrates and forms fall back to a native GET. Restart `next dev` after changing it.

### Prisma

- `lib/db.ts` caches the client on `globalThis` in dev. Restart the dev server after a schema change.
- With the pg adapter, a P2002 reports only the index name (`meta.driverAdapterError.cause.constraint.index`, like `User_username_key`). `lib/core/errors.ts` parses it into a field. Postgres reports one violation at a time.
- `prisma migrate dev` refuses to run non-interactively. When a migration is approved, generate the SQL with `prisma migrate diff` and apply it with `prisma migrate deploy`.
- The npm `latest` tag for the `prisma` CLI may point at an 8.x release candidate. Keep CLI and client both on 7.10.1.

### Zod and forms

- Don't add `abort: true` to field checks in a refined schema (like `registerSchema`): an aborted issue makes Zod skip the `refine`.
- Mismatch checks (Confirm password, Confirm PIN) use a `refine` with `when`, plus a field `onBlur` validator with `onBlurListenTo`.

### Auth

- Only sha256 hashes of device and session tokens are stored; `Session.id` is the hash, so never send session ids to the client. Join link tokens are the exception: stored plain, since they're printed on the wall.
- Auth cookies set `secure` only in production, so phones can test over LAN http.
- The read helpers in `lib/auth/session.ts` never set cookies, so they work in Server Components. `setAuthCookies()`, `setDeviceCookie()` and `endSession()` work only in server actions and route handlers.
- Expired or idle sessions are deleted only on their next request. Anything that lists sessions must filter by the same rules as `getSession()`.
- PIN lockout: `failedPinAttempts` keeps counting across locks and resets only on a correct PIN; `failedPinAttempts / 5` picks the step (1, 5, 15 min).
- Password lockout is split: `/sign-in` uses the User fields; `/manage/login` counts on the Session, and the 5th miss ends the session. Don't touch the User lock fields from `/manage/login`.
- Auth-flow calls the session module `lib/auth.ts`; it's `lib/auth/session.ts`.

### Phones and browsers

- iOS ignores `inputMode` on password fields, so `PinInput` uses `type="text"` with `-webkit-text-security`.
- iOS Safari doesn't open the keyboard on a programmatic focus without a tap.
- To keep focus during a pending submit, make the input `readOnly`, not `disabled`.
- The Clipboard API isn't available on LAN http; fall back to `execCommand("copy")`.

### UI

- Dark mode uses the `.dark` class (`&:is(.dark *)`). Leave `disableTransitionOnChange` off the `ThemeProvider`; it cancels the mode toggle's icon animation.
- Row links use a stretched link (`ROW_CLASS` / `ROW_LINK_CLASS` in `components/manage/member-row.tsx`). Any button inside the row needs `relative z-10`.
- `app/(app)/layout.tsx` doesn't render `main`. Pages and nested layouts wrap content in `AppMain`, and any bar that must line up with the logo uses `APP_CONTAINER`.
- Printing: hide non-printable chrome with `print:hidden`, and use `print:text-black` so dark mode doesn't print light text.
