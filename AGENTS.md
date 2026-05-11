# Repository Guidelines

## Project Structure

This is the Vue 3 frontend for Iberia 2084. Use TypeScript, Vue Router and Pinia. Keep route-level screens under `src/views`, reusable UI under `src/components`, global state under `src/stores`, API clients under `src/services`, and shared domain types under `src/types`.

## Commands

Use npm scripts:

```powershell
npm run dev
npm run dev:remoto
npm run build
npm run test:unit
npm run lint
```

`npm run dev` uses Vite's default local dev mode and `.env.local` when present. `npm run dev:remoto` uses Vite mode `remoto`.

## Environment

Only `VITE_` variables are available in browser code. The current contract is:

```properties
VITE_APP_ENV=local
VITE_API_BASE_URL=http://localhost:8080
```

Keep real `.env*` files out of git. Commit only `.env.example`, `.env.local.example`, and `.env.remoto.example`.

## Scope

This repository belongs only to Iberia 2084. Do not bring back code, routes, assets, database dumps, or documentation from La Pipa de Gandalf. The old movie platform and the strategy game must stay separated.

## AI Agent Rules

- Treat `Iberia 2084` as the canonical visible name. Do not reintroduce old project names or filesystem paths with `ñ`.
- Keep every user-facing Spanish string in UTF-8 with correct accents and `ñ`. Search for mojibake before finishing.
- Use fictional parties and institutions. Do not use real party names, logos, slogans, or identifiable current politicians.
- The satire can hit every political family, but it must stay fictional, systemic, and playable.
- Canonical parties are: Pantomima Popular (PP), Unión Progresista Nacional (PISOE), Grupo Independiente Liberal (GIL), Partido Unido Feminista Federal (PUFF...), Votantes obreros con Xilófono (VOX) and Junts Units Nacionalment per la Terra Sobirana (JUNTS). Use "partido" in user-facing Spanish, never "facción".
- The separated Gandalfpolis extraction may be used as UX/gameplay reference when the user asks for it. Rebuild the experience with Iberia 2084 names, assets, resources and contracts; do not reintroduce the old movie platform domain.

## Game UX Rules

- The app opens into a playable experience after auth. Avoid marketing pages unless explicitly requested.
- Show costs, timers, percentages and consequences before any irreversible action.
- Keep the resource UI focused on the three core resources only: pesetas, votos and favores. Do not introduce decorative resource chips; flavor belongs in copy, costs belong in those three resources.
- City UX should keep the strong strategy-game loop: visual city, clickable buildings, levels, upgrade costs, progress bars and queue slots.
- Troop UX should show portrait, amount owned, stats, resource cost, required building, quantity input, training time and active queue.
- Resource exchange, ministries and iberopedia are first-class game views, not explanatory landing sections.
- The global political map should be responsive SVG/JS unless the user explicitly requests raster overlays; every region must be colorable by governing party and clickable for details.
- Corruption screens must show risk of being caught, expected upside and political penalty.
- Crisis screens must show event type, territory, severity, countdown, management plans, success percentage, upside and downside.
- Map, resources, policies, coalition and crisis views must remain usable on mobile and desktop without overlapping text.
- Keep API URLs in environment variables and typed clients, never inside components.

## Implementation Notes

Prefer typed API clients and typed stores. Do not hardcode backend URLs in components. Keep game rules testable outside Vue components whenever possible.
