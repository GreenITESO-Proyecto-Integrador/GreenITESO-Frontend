# GreenITESO Frontend

Frontend project for GreenITESO using React, TypeScript, Tailwind CSS, and Shadcn/UI.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript 5
- **Build Tool**: Vite 5
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS 3 + Shadcn/UI
- **Linting**: ESLint 8
- **Formatting**: Prettier 3
- **Testing**: Playwright 1.40
- **Editor Config**: EditorConfig

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
  ├── main.tsx          # App entry point
  ├── App.tsx           # Root component
  └── index.css         # Global styles

tests/
  └── example.spec.ts   # Example test

public/                 # Static assets
```

## Code Conventions

- **camelCase**: Variables, functions, hooks
- **PascalCase**: Components, interfaces, types, enums
- **kebab-case**: File and directory names

## Linting & Formatting

Code is linted with ESLint and formatted with Prettier. Run before committing:

```bash
pnpm lint:fix
pnpm format
```

## Testing

Run tests with Playwright:

```bash
pnpm test
```

Tests run against the dev server. Ensure it's running or Playwright will start it.

## Environment Variables

Create `.env.local` with:

```
VITE_API_BASE_URL=http://localhost:3001
VITE_ENV=development
```
