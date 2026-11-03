# ShelfWatch

ShelfWatch is a barcode-scan tool for retail teams to track product pull dates. Scan an item, set the date it needs to come off the shelf, and see what's due today.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS): one app, no separate backend
- Prisma ORM (v7, with the `pg` driver adapter)
- PostgreSQL

## Run locally

Requires Node.js 20+ and a running Postgres database.

1. Set up env:
   ```bash
   cp .env.example .env
   ```
   Then set `DATABASE_URL` in `.env` to your Postgres connection string.
2. Install dependencies (this also generates the Prisma client):
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Folder rules

- All database and business logic lives in plain functions under `lib/` (for example `lib/pulls.ts`).
- Server actions and route handlers only call `lib/` functions. No Prisma calls in components or actions.
- `lib/db.ts` exports the single shared Prisma client. Import it only from `lib/`.
