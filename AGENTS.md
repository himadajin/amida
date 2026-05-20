# The amida

This repository contains a simple web app for creating and tracing an Amidakuji lottery board.

## Project Structure & Module Organization

This is a Vite React TypeScript app for an Amidakuji board. Code lives in `src/`.

- `src/App.tsx` coordinates board state, tracing actions, and layout.
- `src/components/` contains React UI, currently `AmidaBoard.tsx`.
- `src/logic/` contains board-generation and path-tracing logic plus tests.
- `src/test/setup.ts` configures the Vitest/jsdom test environment.
- `src/assets/` and `public/` store images and static browser assets.
- `dist/` is generated build output and should not be edited.

Keep reusable rules in `src/logic/`; keep rendering and interaction code in components.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite development server with HMR.
- `npm run build` runs TypeScript project builds and creates the production bundle.
- `npm run preview` serves the built app locally for final checks.
- `npm run test` runs the Vitest suite once.
- `npm run lint` checks TypeScript and React hook rules with ESLint.
- `npm run format` formats the repository with Prettier.
- `npm run format:check` verifies formatting without writing changes.

Run `npm run lint`, `npm run test`, and `npm run build` before PRs that change behavior.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and ES modules.
Follow Prettier formatting: two-space indentation, single quotes, semicolons,
and trailing commas where Prettier adds them.

Name React components in PascalCase, hooks and handlers in camelCase,
and types/interfaces in PascalCase.
Keep pure logic functions descriptive, such as `generateAmida` or `tracePath`.

## Testing Guidelines

Tests use Vitest with jsdom and Testing Library setup.
Place tests next to covered code using `*.test.ts` or `*.test.tsx`; for example,
`src/logic/amida.test.ts`.

Use deterministic inputs for logic tests.
When randomness is involved, inject a seeded `random` function.
Cover edge cases for board constraints, path tracing, and result mapping.

## Agent-Specific Instructions

Do not edit generated `dist/` output unless explicitly requested.
Preserve user-facing behavior while refactoring, and add or update focused tests for changes in `src/logic/`.
After editing code, run `npm run format`, `npm run lint`,
and `npm run test` before handing off results.

Do not run `git commit`, `git push`, or `git pull` unless the user explicitly instructs you to do so.
