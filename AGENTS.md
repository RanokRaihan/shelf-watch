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
- Phone-first touch sizes: buttons default `h-12 text-base`, `sm` at least `h-10`, `lg` `h-14`; inputs `h-12 text-base`.
- Don't change theme colors or radius in `app/globals.css`; Ranok sets those.

## Files

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Home page: a simple welcome message, no features yet |
| `app/layout.tsx` | Root layout and page metadata (title "ShelfWatch") |
| `app/generated/prisma/` | Generated Prisma client (gitignored, rebuilt by `npm install` / `prisma generate`) |
| `app/ui-test/page.tsx` | Temporary page showing every button variant/size and an input, for checking touch sizes on a phone. Ranok will delete it |
| `components/ui/` | shadcn/ui components: `button`, `input`, `label`, `card` only. Add more only when asked |
| `components.json` | shadcn/ui config (style `base-nova`, Base UI primitives, CSS variables, lucide icons) |
| `lib/utils.ts` | shadcn `cn()` class helper (re-exported from the `cn` package) |
| `lib/db.ts` | The single shared Prisma client (`db`), using `@prisma/adapter-pg` |
| `prisma/schema.prisma` | Prisma schema, owned by Ranok. Do not edit. |
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
