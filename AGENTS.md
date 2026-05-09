# Repository Guidelines

## Project Structure

This is the Vue 3 frontend for España 2084. Use TypeScript, Vue Router and Pinia. Keep route-level screens under `src/views`, reusable UI under `src/components`, global state under `src/stores`, API clients under `src/services`, and shared domain types under `src/types`.

## Commands

Use npm scripts:

```powershell
npm run dev
npm run dev:remoto
npm run build
npm run test:unit
npm run lint
```

`npm run dev` uses Vite mode `local`. `npm run dev:remoto` uses Vite mode `remoto`.

## Environment

Only `VITE_` variables are available in browser code. The current contract is:

```properties
VITE_APP_ENV=local
VITE_API_BASE_URL=http://localhost:8080
```

Keep real `.env*` files out of git. Commit only `.env.example`, `.env.local.example`, and `.env.remoto.example`.

## Scope

This repository belongs only to España 2084. Do not bring back code, routes, assets, database dumps, or documentation from La Pipa de Gandalf. The old movie platform and the strategy game must stay separated.

## Implementation Notes

Prefer typed API clients and typed stores. Do not hardcode backend URLs in components. Keep game rules testable outside Vue components whenever possible.
