# Testing and verification

Release candidate audit: 24 October 2026, Windows, Node 22.16.0, npm 11.4.0, Playwright 1.64.1. Install using `npm ci --legacy-peer-deps`; use `npm.cmd` on Windows if needed. Build before browser tests. Unverified candidate CI is not counted as a pass.

| Gate                      | Recorded local result                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | Passed                                                                                                                                |
| `npm run typecheck`       | Passed; strict app, server and tool configurations                                                                                    |
| `npm test`                | 6 files, 23 unit/component/API/security tests passed                                                                                  |
| `npm run build`           | Passed; SPA and compiled Node output                                                                                                  |
| `npm run test:e2e`        | 36/36 passed in 3.3 minutes on the compiled candidate; Chromium, Firefox and WebKit                                                   |
| `npm run test:production` | Passed: compiled public mode, SPA reload, REST restrictions, static allowlist, CSP and actual WS feed                                 |
| `npm run test:soak`       | Passed: 180 seconds, 100k retained events, two reconnects, 300 display cap, zero clients after close                                  |
| `npm run benchmark`       | Baseline reproduced; final measurements in performance.md                                                                             |
| Visual matrices           | 36 before and 36 after captures, zero page overflow in both                                                                           |
| Repository hygiene        | `git diff --check` passed; 18 Markdown files checked, no broken internal links; package/lockfile versions and dependencies consistent |

The final browser run had zero axe violations across 108 route/theme/width scans, zero page overflow and no captured CSP/uncaught-page errors in the route matrix. Public Settings additionally passed two axe scans at 375/1440 px. These are the tested cases, not proof that every possible interaction is accessible.

## Unit, component and API coverage

- `server/data.test.ts`: deterministic/schema-valid events, reconciled KPI/bucket/service/severity totals, combined filters, capped/sorted 100k pages, honest empty summaries and incident evaluation/deduplication.
- `server/api.test.ts`: rule validation/create/edit, real WebSocket batches, failure injection/reset and rejection of stale incident acknowledgement.
- `server/security.test.ts`: unsafe environment rejection, public mutation denial, origins, socket cap, request budget, static/source isolation, oversized bodies, methods, loopback Host and malformed URL recovery.
- `useStream.test.ts`: pure queue bounds and retry delays. `lifecycle.test.tsx`: pending-buffer clear/pause/reset, reconnect scheduling and unmount cleanup with controlled sockets/timers.
- `ui.test.tsx`: pending/empty distinction and keyboard activation of error retry.

## Browser matrix

Twelve scenarios run on each of Chromium, Firefox and WebKit (36 tests):

1. Tab/Shift+Tab dialog containment, Escape/restored focus, visible outline, mobile heading focus and reduced-motion loading behavior.
2. Exact Analytics snapshot/service propagation into investigation URLs.
3. Live dataset reset discarding old events without duplicate React keys.
4. Explorer URL restoration, virtual rows and detail drawer focus.
5. Theme/layout persistence, command navigation and mobile navigation.
6. Alert create, edit, enabled-state feedback and persisted reload.
7. Stream pause/resume and recovery after an actual server-side disconnect.
8. API failure/retry and fewer than 35 mounted table rows with a 100k dataset/500-row page, then page 2 of 200.
9. All six routes, two themes and three widths (375/768/1440), axe WCAG 2 A/AA, 2.1 AA and 2.2 AA tags, no page overflow or uncaught page errors: **108 scans across three engines**.
10. Preferences persistence, empty data and incident acknowledgement/resolution.
11. Secondary sorting, columns and selection in all engines; clipboard permission/readback **only in Chromium**, because permission support differs across engines.
12. Native desktop drag, keyboard width/reorder alternatives and default-layout restoration.

One worker shares one in-memory test service. Each scenario freezes streaming, disables failures and loads 5,000 events. Rules persist within a run, so tests use unique names. Playwright starts a fresh **compiled** local-mode server on port 4175 and stops it afterwards; it refuses to reuse another process. Development HMR and user investigations stay outside release tests. Ports 4174/4175 must be free. Run `npx playwright install firefox webkit` locally with installed Google Chrome; CI uses the official Playwright image with all three bundled engines and OS dependencies preinstalled. WebKit on Windows is Playwright's engine, not physical Safari/iOS.

## Visual evidence

[Before gallery](release-audit/before/index.html) and [after gallery](release-audit/after/index.html) contain every route/theme/width combination with JSON overflow results. Public-mode screenshots additionally show restriction feedback. Older `docs/screenshots/` files remain historical flagship evidence; README uses the release captures.

Run `node scripts/visual-audit.mjs before` or `after` against a disposable local demo. It defaults to port 5173, or accepts `PULSE_AUDIT_URL` pointing to a fresh compiled local server. It changes that server's dataset/simulation and leaves streaming frozen for deterministic images. Do not target public mode or an investigation you need to preserve. This audit's after images use isolated compiled port 4176; before images used baseline Vite. Frozen stream screenshots intentionally show recovery/empty states; live arrivals are verified separately.

## Failure history and corrections

Genuine regressions corrected: clear/pause retained queued arrivals; resets reused live IDs; stale acknowledgement could reopen resolved incidents; WebKit pointer clicks failed to establish a dialog opener; native Tab traversal could reach browser chrome; malformed URLs escaped the request error boundary. Targeted regression tests cover these fixes.

Test corrections: the command locator now uses its actual accessible name; alert-toggle reload waits for persistence rather than optimistic UI; loading checks handle multiple panels. Initial cross-engine runs exposed the focus failures. Forward/reverse keyboard regressions subsequently passed in all engines.

An intermediate full development run was **35/36**: WebKit's Save target detached while Vite reloaded during documentation edits. Its trace recorded new Vite connections and no Save request. Final E2E uses an isolated compiled server. The first compiled run was also **35/36**, revealing Zod's eval probe under Firefox CSP. A validation bootstrap now sets `jitless` before schema imports, preserving the CSP; its focused regression passed. The route matrix also listens for CSP errors. Public smoke initially needed an explicit browser context for axe; the corrected harness passed. Failed runs are not represented as passes.

The sandbox initially blocked filesystem/socket operations; successful checks ran with the necessary local execution permissions. The npm peer-resolver issue is documented in README; an installation failure was not treated as verification.

## CI and limits

The release candidate `f2996f1317380fa1a3e256c11d0a88b7711adb3e` passed both the [branch run 40017479701](https://github.com/Kevin1skyrj/pulse-analytics/actions/runs/40017479701) and [pull-request run 40017560360](https://github.com/Kevin1skyrj/pulse-analytics/actions/runs/40017560360). The expanded workflow runs lint, types, unit tests, build, all three engines, public smoke, benchmark and the three-minute soak, uploading failure traces and smoke/soak reports.

The subsequent [main run 40018572355](https://github.com/Kevin1skyrj/pulse-analytics/actions/runs/40018572355), at merge commit `1c63d788125ddc7b2b124964cb6be24d9e43d5b7`, contains the same repository tree. Lint, types, all 23 unit/component/API/security tests and build passed. Downloading 119 MB of Playwright Linux dependencies from the Ubuntu mirror then consumed the remaining job time; GitHub cancelled the job at its 20-minute limit before browser tests ran.

The workflow now uses `mcr.microsoft.com/playwright:v1.64.1-noble`, following [Playwright's container CI guidance](https://playwright.dev/docs/ci#via-containers), and removes the per-run browser/OS installation step. Node 22, all quality gates and the 20-minute job limit remain. When upgrading Playwright, update the container tag alongside the version resolved in `package-lock.json`; mismatched versions can leave browser executables unavailable. **The updated container workflow still needs the owner's commit/push and a successful GitHub run.**

No formal WCAG certification, NVDA/VoiceOver session, real-device pass, sustained concurrency load, day-long browser heap study, external HTTPS/WSS deployment or Docker image build is claimed. Heap samples cover one Node process containing server and test client; they do not measure React browser memory. HTTP-loopback smoke does not prove a hosting proxy's TLS configuration. See [performance](performance.md), [accessibility](accessibility.md) and [deployment](deployment.md).
