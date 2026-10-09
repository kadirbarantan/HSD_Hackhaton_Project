# Career Path web app

React + TypeScript + Vite + Tailwind CSS. See the [main README](../README.md) for how to run the whole project.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173, forwards `/api` to the API on port 5080 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Lint with oxlint |

## Conventions

- Data loading: `useApi<T>(path)` from `src/lib/useApi.ts` returns `{ data, error, loading, reload, mutate }` and refetches when the signed-in user changes.
- Mutations: call `api<T>(path, { method, body })` from `src/lib/api.ts`, then update the cache with `mutate`. Errors come back as readable messages through `errorMessage(err)`.
- Signed-in user: `useAuth()` gives `user`, `login`, `logout`, `refresh` and `updateUser`. Call `refresh()` after anything that changes the badge counts in the header.
- Types in `src/lib/types.ts` mirror the backend DTOs. Change both together.
- Styling: Tailwind classes, merged with `cn()` so a `className` passed to a component overrides its defaults. Buttons use `Button`/`ButtonLink` from `src/components/ui.tsx`.
- Files that export components export only components (a lint rule), so hooks and helpers live in `src/lib`.
