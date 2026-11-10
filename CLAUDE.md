# ShelfWatch

@AGENTS.md

## Stack

Next.js (App Router, TypeScript, Tailwind), Prisma 7 (`pg` driver adapter), Postgres. One app, no separate backend. `DATABASE_URL` comes from `.env` (see `.env.example`).

## Folder rules

- All database and business logic goes in plain functions under `lib/`, in a folder per area (for example `lib/pulls/pull-items.ts`).
- Server actions and route handlers only call `lib/` functions. No Prisma calls in components or actions.
- `lib/db.ts` exports the single Prisma client. Don't create another one.

## Scope

Core loop (scan, set pull date, today's list) plus auth as described in `docs/auth-flow.md`. No notifications or analytics until I say so. Never create or change the Prisma schema; Ranok owns it.

## Housekeeping

Update `AGENTS.md` after every file creation, deletion, or architecture decision.
