# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript application for an Amida lottery UI. Application code lives in `src/`. The main UI is in `src/App.tsx`, bootstrapped by `src/main.tsx`, with global styling in `src/styles.css`. Core lottery generation and tracing logic lives in `src/lib/amida.ts`; keep domain rules there instead of embedding them in components. Tests are colocated with implementation, such as `src/App.test.tsx` and `src/lib/amida.test.ts`. Test setup is in `src/test/setup.ts`, and specs are in `docs/specs.md`.

## Build, Test, and Development Commands

- `npm run dev`: starts the Vite dev server on `0.0.0.0` for local browser testing.
- `npm run build`: runs TypeScript project checks with `tsc -b`, then creates a production Vite build.
- `npm run check`: runs ESLint across the repository.
- `npm run format`: formats files with Prettier.
- `npm test`: runs the Vitest suite once.
- `npm run test:ui`: opens the Vitest UI for interactive test runs.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing style: two-space indentation, single quotes, semicolons, trailing commas where Prettier adds them, and named exports for reusable domain helpers. Components and types use `PascalCase`; functions and variables use `camelCase`. Keep React state and rendering in components, and deterministic lottery behavior in `src/lib/amida.ts`.

## Testing Guidelines

Vitest runs in `jsdom` with Testing Library and `@testing-library/jest-dom` configured through `src/test/setup.ts`. Name test files `*.test.ts` or `*.test.tsx` and place them near implementation. Prefer user-visible UI assertions, such as `screen.getByRole` or `screen.getByLabelText`. For library tests, cover deterministic behavior with `createSeededRandom`.

## Commit & Pull Request Guidelines

Git history uses concise Conventional Commit-style subjects, for example `feat: implement application` and `refactor: improve separation of concerns...`. Use the same pattern: `feat:`, `fix:`, `refactor:`, `test:`, or `docs:` followed by a short imperative summary.

Pull requests should include a brief description, reason for the change, and verification commands, such as `npm test` and `npm run check`. Include screenshots or short recordings for visible UI changes, especially the lottery display or interaction flow.

## Agent-Specific Instructions

Before changing behavior, read `docs/specs.md` and relevant tests. Do not modify `dist/` by hand. Keep changes scoped, preserve existing Japanese UI copy unless requested, and update tests when modifying generation, tracing, validation, or user interactions.
