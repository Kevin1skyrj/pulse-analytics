# Testing and verification

Run from the repository root after `npm ci --legacy-peer-deps`. Use `npm.cmd` on Windows if needed.

| Command             | Verified result, 24 October 2026                                      |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | Local Vite 5173 and REST/WebSocket 3001 started and exercised         |
| `npm run lint`      | Passed                                                                |
| `npm run typecheck` | Passed; also runs inside build                                        |
| `npm test`          | 4 files, 14 tests passed                                              |
| `npm run build`     | Passed; strict application/server/config checks and production chunks |
| `npm run test:e2e`  | 9 Chromium/installed Chrome browser scenarios passed                  |
| `npm run benchmark` | 5k/100k measurements recorded in performance.md                       |
| `git diff --check`  | Passed; Windows line-ending notices are informational                 |

## What the tests establish

`server/data.test.ts` verifies deterministic/schema-valid events, reconciled KPI/bucket/service/severity totals across windows, combined filters, capped/sorted 100k pages, honest empty summaries and incident opening/deduplication/resolution.

`server/api.test.ts` binds an ephemeral local port and exercises rule validation/create/edit, real WebSocket batches and failure injection/reset. A frozen-clock regression verifies that reopening a resolved incident creates a distinct ID, and the incident browser flow checks for duplicate IDs and console errors. `useStream.test.ts` verifies queue bounds and retry delays. `ui.test.tsx` checks pending/empty distinction and keyboard activation of error retry.

The nine browser scenarios cover:

1. Filter restoration from URLs, virtualization, event metadata and drawer Escape/focus restoration.
2. Theme/layout persistence, command entry and mobile navigation.
3. Rule creation, editing and enabled-state feedback.
4. Live pause/resume and recovery after a real server-side socket disconnect.
5. API failure/retry and bounded DOM with 100,000 events.
6. All six routes in both themes with axe WCAG 2 A/AA, 2.1 AA and 2.2 AA tags; no page overflow at 375 and 768 px; no uncaught page errors.
7. Saved preferences, empty data and incident acknowledgement/resolution.
8. Secondary sorting controls, column visibility, selection and clipboard output.
9. Native desktop drag, width changes and default-layout restoration.

Playwright uses one worker because scenarios share a mutable demo server. Before each scenario it disables streaming/failures and loads 5,000 events. Rules persist until server restart, so tests use unique rule names. Local runs use installed Chrome; CI installs bundled Chromium. Playwright starts the app when needed, or reuses an existing local instance. Failure screenshots/traces are ignored Git artifacts in `test-results/`.

## Visual review and reproducibility

Actual screenshots in `docs/screenshots/` cover all routes plus dark/light, 1440 px desktop, 768 px tablet and 375 px mobile layouts. Run `node scripts/capture-preview.mjs` with a disposable local server running to regenerate them. This script resets its dataset/simulation, uses installed Chrome and re-enables streaming at the end. It preserves existing rules; restart the API first for clean rule screenshots.

During review, fixes included narrow datetime fields overflowing mobile, async rule-switch feedback, virtualized drawer scroll/focus, tablet panel density, contextual empty states and duplicate incident IDs when a frozen simulation clock was reused. Test corrections addressed ambiguous labels/status regions and drag gestures whose destination scrolled the source out of view. The final suite passed after those changes; prior failures are not hidden as passing runs.

The sandbox initially blocked Vitest temporary renames; the successful test run used normal local filesystem/socket permissions. npm 11.4 peer resolution required the documented install flag. Neither issue was silently treated as a passing test.

## CI and limits

`.github/workflows/ci.yml` installs from the lockfile on Node 22 and runs lint, types, unit tests, build and Chromium E2E, uploading failure artifacts. The workflow has not run on GitHub for these changes because they remain uncommitted and unpushed.

Automated scans do not certify WCAG compliance. No manual NVDA/VoiceOver pass, Firefox/WebKit matrix, real mobile device run, long-running memory soak, production deployment or concurrency test is claimed. Responsive sizes are browser emulation. Review accessibility.md and tradeoffs.md before making portfolio claims.
