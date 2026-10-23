# Project structure

| Path                       | Responsibility                                               |
| -------------------------- | ------------------------------------------------------------ |
| `src/main.tsx`             | StrictMode entry and global CSS                              |
| `src/app/Router.tsx`       | Query provider, lazy routes, not-found screen                |
| `src/app/Shell.tsx`        | Sidebar, mobile dialog, command entry, theme control         |
| `src/components/ui.tsx`    | Shared accessible UI primitives                              |
| `src/features/overview`    | KPIs, widget visibility/order/width controls                 |
| `src/features/events`      | URL filters, paged virtual table, event drawer               |
| `src/features/analytics`   | Cross-filtering, comparative metrics and shared charts       |
| `src/features/live`        | Connection lifecycle and bounded event feed                  |
| `src/features/alerts`      | Rule forms, switches and incident actions                    |
| `src/features/settings`    | Preferences, simulation controls and dataset laboratory      |
| `src/services`             | Fetch, validation, query wrapper and REST mutations          |
| `src/state/preferences.ts` | Validated persisted client preferences                       |
| `src/index.css`            | Tailwind v4 import, semantic tokens and component styles     |
| `shared/contracts.ts`      | Shared schemas and inferred TypeScript types                 |
| `server/data.ts`           | Seeded generation, filtering, sorting, aggregation and rules |
| `server/app.ts`            | HTTP/WebSocket transport and in-memory lifecycle             |
| `server/index.ts`          | Loopback process entry                                       |
| `scripts/benchmark.ts`     | Reproducible data-processing benchmark                       |
| `tests/e2e`                | Real browser integration scenarios                           |
| `.github/workflows/ci.yml` | Lint, types, tests, build and Chromium CI                    |

Feature components own orchestration, while network serialization and pure data operations stay outside presentation. Do not add shared abstractions just because two pieces of JSX look similar: extract when they share behavior or policy.
