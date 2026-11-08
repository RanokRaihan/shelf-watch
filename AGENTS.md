<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ShelfWatch: agent notes

Barcode-scan tool for retail teams to track product pull dates. Keep this file updated after every file creation, deletion, or architecture decision.

## Rules

- Scope: Core loop only: scan, set pull date, today's list. No auth, notifications, or analytics until I say so. Never create or change the Prisma schema; Ranok owns it.
- All database and business logic goes in plain functions under `lib/` (for example `lib/pulls.ts`).
- Server actions and route handlers only call `lib/` functions. No Prisma calls in components or actions.
- Don't run migrations.
- `components/ui/button.tsx` and `components/ui/input.tsx` keep shadcn's stock sizes (button default `h-8`, `sm` `h-7`, `lg` `h-9`; input `h-8`). For phone-first touch sizes, set them where the component is used with `className`, as the landing page and register form do (`h-12 text-base`).
- Don't change theme colors or radius in `app/globals.css`; Ranok sets those.
- Use shadcn as much as possible: components from `components/ui/` and theme tokens (`bg-background`, `bg-muted`, `bg-primary`, `text-muted-foreground`, and so on). No hardcoded colors in pages or components.

## Files

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Landing page (server component), built from shadcn `Card` and `buttonVariants` with theme tokens only. Bricolage Grotesque headline font is loaded here. Links to `/register` and `/signin` (`/signin` doesn't exist yet) |
| `app/layout.tsx` | Root layout, page metadata (title "ShelfWatch"), and `ThemeProvider` |
| `app/generated/prisma/` | Generated Prisma client (gitignored, rebuilt by `npm install` / `prisma generate`) |
| `app/not-found.tsx` | Two-column 404 page: message and home link on the left, a shelf with one empty spot on the right, with a scan line sweeping across the shelf and back on a loop, easing at both ends and slowing without stopping at the gap in the middle (off for reduced motion). Theme tokens only. Loads Bricolage Grotesque like the landing page |
| `app/(auth)/register/page.tsx` | Signup page at `/register`, the URL the landing page links to. Renders `RegisterForm`, with a back arrow to `/` before the ShelfWatch name |
| `components/ui/` | shadcn/ui components: `button`, `input`, `label`, `card`, `separator`, `field`, `select` only. Add more only when asked |
| `components/auth/register-form.tsx` | Signup form (client component, TanStack Form). Store info section first, then personal info, stacked on phones. From `lg` up each section has its heading on the left and a 2-column field grid on the right. Validates on submit. `handleRegister` only logs the values, including password and PIN, to the browser console for now; remove that when the backend is added |
| `components/theme-provider.tsx` | shadcn wrapper around the `next-themes` provider |
| `components/mode-toggle.tsx` | One-click light/dark button with shadcn's animated Sun/Moon icons |
| `components.json` | shadcn/ui config (style `base-nova`, Base UI primitives, CSS variables, lucide icons) |
| `lib/utils.ts` | shadcn `cn()` class helper (re-exported from the `cn` package) |
| `lib/validations/register.ts` | Zod `registerSchema` for signup, the timezone list, and `PIN_LENGTH` |
| `lib/action-result.ts` | `ActionResult<T>` shape every server action returns (`{ ok: true, data, message? }` or `{ ok: false, error: { code, message, fieldErrors? } }`), the `ok()` / `fail()` builders, and `toFormErrors()` for TanStack Form's `onSubmitAsync`. Safe on client and server |
| `lib/errors.ts` | `AppError` (thrown by `lib/` business functions for expected errors) and `mapPrismaError()` (P2002 to `CONFLICT`, P2025 to `NOT_FOUND`, P2003 to `CONFLICT`). Server only |
| `lib/safe-action.ts` | `createAction(schema, handler)` / `createAction(handler)`: validates input with Zod, runs the handler, turns errors into an `ActionResult`, and rethrows `redirect` / `notFound`. Server only, no `"use server"` |
| `lib/db.ts` | The single shared Prisma client (`db`), using `@prisma/adapter-pg` |
| `prisma/schema.prisma` | Prisma schema, owned by Ranok. Do not edit. Models: `Store`, `User`, `StoreInvite`, `Device`, `Product`, `StoreProduct`, `PullItem`, `PullEvent`; enums: `Role`, `UserStatus`, `PullStatus`, `PullAction` |
| `prisma/migrations/` | Prisma migration history. `20261105041728_init` is the first migration |
| `prisma7.config.ts` | Prisma CLI config (schema path, migrations path, `DATABASE_URL` via dotenv) |
| `.env` / `.env.example` | `DATABASE_URL`. `.env` is gitignored, `.env.example` is committed |
| `README.md`, `CLAUDE.md`, `AGENTS.md` | Project docs |
| `.agents/`, `.claude/skills/`, `.windsurf/`, `skills-lock.json` | Prisma agent skills, written automatically by `prisma init` |

## Decisions

- 2026-11-02: Single Next.js app (App Router, TS, Tailwind); no separate backend.
- 2026-11-02: Prisma pinned to stable 7.10.1 (CLI and client). The npm `latest` tag for the `prisma` CLI pointed at 8.0.0-rc, which didn't match `@prisma/client`.
- 2026-11-02: Prisma 7 needs a driver adapter, so `lib/db.ts` uses `@prisma/adapter-pg` + `pg`. The client is cached on `globalThis` in dev to survive hot reloads.
- 2026-11-02: Generated client lives at `app/generated/prisma` (the `prisma init` default, left as-is). `postinstall` runs `prisma generate`.
- 2026-11-02: Replaced the scaffold home page with a welcome message. Deleted the unused scaffold images in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
- 2026-11-02: Added shadcn/ui via `npx shadcn@latest init --defaults` (style `base-nova`, built on `@base-ui/react`, not Radix). Components import `cn` straight from the `cn` npm package (published by the shadcn maintainer) rather than from `@/lib/utils`. Init also added `shadcn`, `tw-animate-css`, `class-variance-authority`, `lucide-react` and `cn` as dependencies and rewrote `app/globals.css` with its theme tokens.
- 2026-11-02: Resized button and input for one-handed phone use (sizes above). Removed the input's `md:text-sm` so it stays 16px on every screen.
- 2026-11-02: Fixed `--font-sans` in `app/globals.css`. Init had set it to `var(--font-sans)` (points at itself), so the Geist font didn't apply. It now points to `--font-geist-sans`.
- 2026-11-02: Dark mode follows the system setting (`prefers-color-scheme`) for now, per Ranok. In `app/globals.css` the `dark` variant is a media query and shadcn's `.dark { ... }` tokens sit inside `@media (prefers-color-scheme: dark) { :root { ... } }`. Color values unchanged. When the theme toggle is added, switch back to a `.dark` class.
- 2026-11-04: Wrote the Prisma schema from Ranok's spec, as a one-time exception to the no-schema-changes rule. The rule still stands. Only `prisma format` and `prisma validate` were run: no migration exists yet, the database is unchanged, and the generated client has not been rebuilt.
- 2026-11-04: Fixed `prisma/schema.prisma` at Ranok's request after hand edits left it failing validation (duplicate `PullItem.user`). Removed the unnamed `User.pullItems` / `PullItem.user` / `PullItem.userId` relation. Added optional `PullItem.updatedById` / `updatedBy` as the missing side of `User.updatedPullItems` (`PullItemUpdatedBy`). Made `PullItem.product` required, since `upc` is required: an unknown UPC needs a bare `Product` row first. No migration has been run.
- 2026-11-04: Removed `PullItem.updatedById` / `updatedBy` and `User.updatedPullItems` at Ranok's request. `PullEvent` is the record of who changed a pull item.
- 2026-11-04: Ran the first migration (`20261105041728_init`) with `prisma migrate dev --name init`, as a one-time exception approved by Ranok. It created the local `shelfwatch` database and all tables, including Ranok's `StoreProduct` model. The "Don't run migrations" rule still stands.
- 2026-11-05: Replaced the home page with the landing page, built only with Tailwind and shadcn (no CSS modules). The scan line on the hero barcode uses `tw-animate-css` utilities.
- 2026-11-05: Added dark mode the shadcn way, at Ranok's request: `next-themes`, `ThemeProvider` in the root layout, default theme `system`. This replaces the system-only setup from 2026-11-02. In `app/globals.css` the `dark` variant is now `&:is(.dark *)` and the `prefers-color-scheme` block is gone, so dark colors come from the existing `.dark` tokens. `ModeToggle` is one click (no dropdown). `disableTransitionOnChange` is deliberately left off the provider because it would cancel the icon animation.
- 2026-11-05: Recolored the landing page at Ranok's request because the first version was too colorful. All hardcoded colors are gone. Sections use neutral theme tokens with `primary` as the only accent, the tiles are shadcn `Card`s, and buttons use standard variants. Layout unchanged.
- 2026-11-05: At Ranok's request, "How it works" uses the same `bg-background` as the hero. A shadcn `Separator` (added for this) now divides it from "Made for the store floor".
- 2026-11-05: Added the signup form at Ranok's request, UI only, with no backend or submit logic. Uses `@tanstack/react-form` and `zod`, plus shadcn `field` and `select`. Validation schemas live in `lib/validations/`. The route is `/register` to match the landing page links. Field names follow the schema (`username`, `pin` for `pinHash`), except `storeName` for `Store.name` because `name` is the user's. `email` is optional, matching the schema. `password` is required here even though nullable in the schema, because the signup user is the manager. Assumed rules until Ranok confirms: 4-digit PIN, password 8 to 72 characters, username 3 to 30 characters, US timezones only.
- 2026-11-05: At Ranok's request, the touch-size rule now matches the code. `button` and `input` stay at shadcn's stock sizes, as they have been since `de352a1`, replacing the 2026-11-02 resize. Larger touch sizes are set per use with `className`.
- 2026-11-07: Added our own server action helpers (no library), at Ranok's request. Every action returns an `ActionResult` and is built with `createAction`. `lib/` functions throw `AppError` for expected errors; the wrapper converts those and known Prisma errors into failures, logs anything else, and sends the client only a generic `INTERNAL` message. It calls `unstable_rethrow` first so `redirect()` and `notFound()` still work. Added the `server-only` package. Unique-constraint field names are read from `meta.target` or, with the pg adapter, `meta.driverAdapterError.cause.constraint.fields`; confirm against a real P2002 when signup lands. Auth context (`UNAUTHENTICATED` / `FORBIDDEN`) is reserved and not built.
