# Pulse delivery report

Release candidate prepared locally on 24 October 2026. The flagship is committed at `b54b296`; this hardening work remains uncommitted on `codex/v1-release-hardening`. No commit, push, tag, pull request or external deployment was performed by the agent. **v1.0 is not released: final-candidate GitHub CI requires the owner's commit/push.**

## Architecture

The existing React/TypeScript/Vite/Tailwind v4 foundation and feature-oriented structure are preserved. Six lazy route modules use small shared UI primitives. One Node HTTP/WebSocket process owns deterministic events, aggregates, rules and incidents; its production entry also serves built SPA assets. Local mode is mutable and loopback-only. Public mode is read-only and bounded. Shared Zod contracts define the transport boundary. URL, component, REST, preferences and stream state have separate owners.

## Completion matrix

| Requested capability        | Delivered evidence                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Responsive shell            | Collapsible desktop sidebar, mobile dialog, six implemented routes, active links, command entry, theme/identity                  |
| Overview                    | Four derived KPIs, volume/severity charts, services, recent events, time selection                                               |
| Event investigation         | Search, compound filters, UTC ranges, two sort keys, pages + virtual rows, columns, selection, JSON drawer/copy, URL restoration |
| Genuine real-time transport | Local WebSocket, state reporting, 500 ms batches, bounded buffers, pause/resume, backoff/reconnect                               |
| Analytics                   | Derived charts, comparative windows, service cross-filtering, investigation links, textual/table alternatives                    |
| Alert workflow              | Validated create/edit/toggle, severity windows, evaluated incidents, acknowledge/resolve                                         |
| Customization               | Visibility, dragging, keyboard movement, grid sizing, persistence and defaults                                                   |
| Preferences/productivity    | Theme, density, workspace name, command shortcut, action feedback, simulation laboratory                                         |
| Data scale/reliability      | Seeded 5k/100k datasets, REST pagination, configurable latency/failure, cancellation and retry                                   |
| Quality                     | Strict types, lint, unit/component/API/E2E checks, automated accessibility, responsive visual review, CI definition              |
| Learning material           | All eleven requested technical documents, README walkthrough and nine-module study sequence                                      |

## Important files

Start with `src/app/Router.tsx` and `Shell.tsx`, then `src/features/`. Shared controls are in `src/components/ui.tsx`; network serialization/cache integration is in `src/services/`; persisted preferences are in `src/state/preferences.ts`. `shared/contracts.ts` defines schemas. `server/data.ts` contains pure data/rule operations; `server/app.ts` supplies transport. `src/index.css` owns tokens and responsive/component styles. See project-structure.md for the complete map.

## Dependency judgment

React Router solves routes/URL state; TanStack Query solves REST caching/cancellation/mutations; TanStack Virtual bounds rows; Recharts supplies chart interaction; Lucide keeps icons consistent; Zod validates runtime data; ws supplies sockets. tsx/concurrently simplify local startup. Vitest, Testing Library, Playwright and axe verify behavior. A global state library, table framework and drag framework were unnecessary for the implemented scope.

## Verification and performance

Lint, strict types, 23 unit/component/API/security tests and the compiled production build pass. **36/36 browser scenarios pass** across Chromium/Firefox/WebKit, with zero violations in 108 axe/viewport combinations. [Exact coverage](testing.md). Public production smoke passes, including mobile/desktop axe, deep-link reload, static isolation, mutation denial and actual WebSockets. Before/after matrices contain 36 views each with no page overflow. Whitespace, internal documentation links and package/lockfile consistency checks pass.

The final 100k workload measured **139.08 ms median / 182.34 ms p95** for local filter/sort/aggregate operations. Browser tests keep the explorer below 35 mounted rows at a 500-row page size. A 180-second soak retained 100k server events/300 display events and returned to zero clients after close, with stable sampled post-GC heap. Main and chart gzip chunks are 125.05 kB and 108.58 kB. [Methodology and limits](performance.md).

## Defects corrected and visual outcome

- Fixed Clear/Pause leaving pending stream arrivals, reset reuse of live IDs and late socket callback cleanup.
- Kept incident drawers synchronized with query refreshes and rejected stale acknowledgement of resolved incidents.
- Fixed modal Tab/Shift+Tab containment and WebKit pointer-opener focus restoration.
- Configured browser validation without Zod's eval probe so production CSP stays enforced without Firefox errors.
- Contained malformed request URLs; added origin checks, public write denial, budgets, caps, heartbeat/backpressure handling, safe static serving and environment validation.
- Scoped Tailwind detection to source files; removed confirmed-unused starter CSS/images/icons. No new dependencies or architecture rewrite.

The graphite/violet identity, typography, grid and density were already coherent and remain. Visible changes clarify synthetic data, explain public read-only mode and disable unavailable mutations. [Before/after gallery and route findings](release-audit.md) also include mobile dialog, error and connected-feed examples.

## Git and handoff

History: Module 02 `d7a1abd9cb34ec07d9cee3f57856d0fcfc18a1c4`, flagship `b54b2963f50ba7d3b6646e32345550b7f5c2c68d`. The flagship's [CI run 40012192211 passed](https://github.com/Kevin1skyrj/pulse-analytics/actions/runs/40012192211). There is no hardening commit SHA yet: the user reserved commits. Review the working-tree diff, commit/push the candidate and require its expanded CI to pass before the recommended `v1.0.0` tag. [Checklist](release-checklist.md) and [draft release notes](release-notes.md).

Run `npm ci --legacy-peer-deps`, then `npm run dev`; open http://127.0.0.1:5173. For compiled production preview use `npm run build` and `npm start` on port 3001 after freeing that port. README retains the learning sequence. The final automated suite owns and stops isolated test processes; the pre-existing development server is not terminated.

## Remaining boundaries

Synthetic data only; no deployed API, identity, tenancy, durable database or notification delivery. Rules reset on restart; public data resets daily. Browser preferences do not synchronize across devices. Retention is finite, offset pages can shift during streaming and reconnection has no cursor replay. Manual screen-reader, real-device, extended browser-heap, high-concurrency and external TLS/WSS verification remain unperformed. Docker artifacts exist but the engine was unavailable for build/run. [Safe native Node hosting instructions](deployment.md) are prepared; no external action occurred.
