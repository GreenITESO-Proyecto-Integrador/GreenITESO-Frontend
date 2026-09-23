# GreenITESO Frontend

Frontend for GreenITESO using React 19, TypeScript, Tailwind CSS v4, and shadcn/ui components.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript 5.7
- **Build Tool**: Vite 6
- **Router**: React Router v7
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS 4 (@theme-based) + shadcn/ui (@base-ui)
- **Linting**: ESLint 10 (flat config)
- **Formatting**: Prettier 3.4
- **Testing**: Playwright 1.63
- **Icons**: Lucide React

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
pnpm dev
```

Server runs at `http://localhost:3000`

## Available Scripts

- `pnpm dev` — Start dev server with hot reload
- `pnpm build` — Build for production
- `pnpm preview` — Preview production build
- `pnpm lint` — Run ESLint
- `pnpm lint:fix` — Fix ESLint issues
- `pnpm format` — Format code with Prettier
- `pnpm format:check` — Check Prettier formatting
- `pnpm type-check` — Type check without emitting
- `pnpm test` — Run Playwright tests
- `pnpm test:ui` — Run tests in UI mode
- `pnpm test:debug` — Debug tests

## Project Structure

```
src/
  ├── main.tsx              # Entry point
  ├── App.tsx               # Root (BrowserRouter + Routes)
  ├── routes.tsx            # Route definitions
  ├── index.css             # Global styles + @theme tokens
  ├── components/
  │  ├── ui/               # shadcn/ui primitives (Button, Input, Card, etc.)
  │  └── custom/           # Custom component variations
  ├── pages/
  │  ├── Home/
  │  │  ├── Home.tsx
  │  │  └── components/    # Page-local subcomponents
  │  └── DesignSystem/     # Design system showcase
  ├── lib/
  │  └── utils.ts          # cn() (clsx + tailwind-merge)
  └── hooks/

tests/
  └── example.spec.ts   # Playwright tests

docs/
  └── DESIGN_SYSTEM.md  # Design tokens, typography, colors, spacing

public/                 # Static assets
```

Routes: `/` (home), `/login` (Microsoft login), `/design-system` (design showcase), `/actions`, `/actions/register`, `/audit`, `/leaderboard`, `*` (fallback to home). Add pages via `src/routes.tsx`.

## UI Components (shadcn/ui)

Built on @base-ui/react primitives. Currently available: Button, Input, Card.

Add new components with:

```bash
pnpm dlx shadcn@latest add <component>
```

This scaffolds `src/components/ui/<component>.tsx`. For custom variants, extend in `src/components/custom/` rather than modifying `ui/` files directly.

Components inherit `cn()` utility (clsx + tailwind-merge) for class merging and design tokens from `src/index.css`.

## Code Conventions

- **camelCase**: Variables, functions, hooks
- **PascalCase**: Components, types, interfaces, enums
- **kebab-case**: File & directory names (except component files)
- Page pattern: `src/pages/<PageName>/<PageName>.tsx` with page-local subcomponents in `components/` subfolder

## Linting & Formatting

Code is linted with ESLint and formatted with Prettier. Run before committing:

```bash
pnpm lint:fix
pnpm format
```

## Design System

Centralized tokens & components at `/design-system` route. See `docs/DESIGN_SYSTEM.md` for:

- Typography (Plus Jakarta Sans, scale from `text-xs` to `text-4xl`)
- Color palette (primary green, secondary sage, semantic status colors)
- Spacing, border-radius, shadows, responsive breakpoints
- Mobile-first rules (44×44px touch targets, fixed bottom nav)

CSS variables defined in `src/index.css` under `@theme` and `:root`.

## Testing

Run tests with Playwright:

```bash
pnpm test
pnpm test:ui       # Interactive test runner
pnpm test:debug    # Debug mode
```

Single test: `pnpm exec playwright test -g "test name"`

Dev server starts automatically if not running. Tests use `page.goto('/')` to hit localhost:3000.

## Environment Variables

Create `.env.local` with:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_MICROSOFT_CLIENT_ID=<Microsoft Entra application client ID>
VITE_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/organizations
VITE_ENV=development
```

The login screen uses Microsoft Entra ID through MSAL with authorization code + PKCE. The
frontend sends the resulting `id_token` and Microsoft Graph `access_token` to
`POST /api/v1/auth/login/`; no client secret is required. Configure the SPA redirect URI as
`http://localhost:3000/login` for local development.
