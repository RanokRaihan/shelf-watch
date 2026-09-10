# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Shelf Watch — a retail app to track and manage expired products. Currently a fresh `create-next-app` scaffold (App Router, no routes/features built yet beyond the homepage).

## Commands

- `npm run dev` — start the dev server (Turbopack, on by default in Next 16 — no `--turbopack` flag needed)
- `npm run build` — production build (also Turbopack by default; fails if a `webpack` config is present without `--webpack`)
- `npm run start` — run the production build
- `npm run lint` — ESLint via the flat config (`eslint.config.mjs`); `next lint` no longer exists in Next 16

No test runner is configured yet.

## Stack notes

- **Next.js 16.3.4** — significantly different from pre-16 training data. Before touching routing, caching, images, or config, check `node_modules/next/dist/docs/` (see AGENTS.md) rather than assuming Next 14/15 behavior. Notably: `middleware.ts` is renamed `proxy.ts`/`proxy()`, `params`/`searchParams`/`cookies()`/`headers()` are async-only (no sync fallback), and there's no `next lint`.
- **UI kit is shadcn's `base-nova` style built on Base UI (`@base-ui/react`), not Radix.** Components in `components/ui/` import from `@base-ui/react/*` — don't assume Radix primitives or props when extending them. Add new shadcn components with `npx shadcn add <component>` (see `components.json` for config: neutral base color, CSS variables, `@` path aliases).
- `cn()` comes from the `cn` npm package (re-exported via `lib/utils.ts`), not a hand-rolled `clsx`+`tailwind-merge` helper.
- Tailwind CSS v4 (CSS-first config in `app/globals.css` via `@import`/`@theme`, no `tailwind.config.js`). Theme tokens (colors, radius, sidebar/chart colors) are CSS custom properties in `:root`/`.dark` in `app/globals.css`.
- Fonts: Geist Sans/Mono, Inter, and Nunito Sans are all loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables; `font-sans` uses Inter.
