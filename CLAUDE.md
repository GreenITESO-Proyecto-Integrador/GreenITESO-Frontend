# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: pnpm.

- `pnpm dev` — dev server (port 3000, host 0.0.0.0)
- `pnpm build` — `tsc` (project refs) + `vite build`
- `pnpm type-check` — `tsc --noEmit`
- `pnpm lint` / `pnpm lint:fix` — ESLint (flat config, `eslint.config.js`)
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm test` — Playwright tests (starts dev server automatically if not running)
- `pnpm test:ui` / `pnpm test:debug` — Playwright interactive modes
- Single test: `pnpm exec playwright test tests/example.spec.ts` (or `-g "test name"` to filter by title)

## Architecture

React 19 + TypeScript + Vite 6, Tailwind CSS v4 (CSS-first config via `@theme` in `src/index.css`, no `tailwind.config.ts` content — that file is legacy/unused), routed with `react-router-dom` v7.

- **Routing**: `src/routes.tsx` exports a flat `routes` array of `<Route>` elements consumed by `src/App.tsx` inside `BrowserRouter`/`Routes`. Add new pages by adding a route entry here, not by nesting route trees.
- **Path alias**: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.json`).
- **Pages**: `src/pages/<PageName>/<PageName>.tsx`, with page-local subcomponents under `src/pages/<PageName>/components/`. Follow this co-location pattern for new pages rather than a flat/global components folder.
- **UI primitives (shadcn/ui)**: live in `src/components/ui/`, built on `@base-ui/react` primitives + `class-variance-authority` (cva) for variants + `cn()` (`src/lib/utils.ts`, clsx+tailwind-merge) for class merging. Do not hand-edit these files for one-off needs — add new components with `pnpm dlx shadcn@latest add <component>` and build custom variations in `src/components/custom/` instead.
- **Design system reference**: `docs/DESIGN_SYSTEM.md` is the source of truth for typography, color tokens (`primary`/`secondary` green/sage scales plus semantic status colors), spacing, border-radius, shadows, breakpoints, and mobile/PWA rules (44×44px min touch targets, fixed bottom nav, `pb-24` safe scroll area). Consult it before introducing new visual patterns — a live showcase of these tokens/components exists at the `/design-system` route (`src/pages/DesignSystem/`).
- **Styling tokens**: CSS variables are defined in `src/index.css` under `@theme` (raw palette) and `:root`/`.dark` (semantic HSL/oklch tokens consumed via `--color-*` mappings). There are currently two overlapping token systems in this file (an HSL-based GreenITESO palette and an oklch-based shadcn default palette) — check which one a component actually resolves against before assuming a token applies.

## Conventions

- camelCase: variables, functions, hooks. PascalCase: components, types, interfaces, enums. kebab-case: file/directory names (except component files, which match the component's PascalCase name).
- Icons: `lucide-react` only, sized via Tailwind `size-*` utilities, inheriting `currentColor`.
