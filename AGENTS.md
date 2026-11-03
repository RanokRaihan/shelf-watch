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

## Files

| Path | Purpose |
| --- | --- |
| `app/` | Next.js App Router pages (still the default scaffold page) |
| `app/generated/prisma/` | Generated Prisma client (gitignored, rebuilt by `npm install` / `prisma generate`) |
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
