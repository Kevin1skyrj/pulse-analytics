# v1.0 release audit

Baseline: `b54b2963f50ba7d3b6646e32345550b7f5c2c68d`, clean `main`, 24 October 2026. Work is on `codex/v1-release-hardening`; commits/pushes remain user-owned.

The baseline GitHub Actions run [40012192211](https://github.com/Kevin1skyrj/pulse-analytics/actions/runs/40012192211) completed successfully for this exact SHA. Local baseline: 14 tests pass. Filter/sort/aggregate benchmark: 5k median 6.60 ms / p95 17.21 ms; 100k median 159.86 ms / p95 188.75 ms, Node 22.16.0 Windows, twelve samples.

## Baseline blockers identified (addressed locally)

- No production asset serving/start command, environment validation or safe public mode. Mutable shared simulator must not be exposed as-is.
- HTTP checks Origin, but WebSocket upgrades do not. Connections/rules have no count caps; slow clients are skipped rather than disconnected, despite documentation claiming otherwise.
- Dataset resets reuse live event IDs while connected clients can retain earlier events.
- Clear/pause do not discard queued, not-yet-rendered stream events.
- Baseline docs incorrectly say flagship changes are uncommitted and CI has never run.
- Only Chromium is configured; full six-route/two-theme/three-width coverage and streaming soak evidence need expansion.

## Audit phases

1. Save before screenshots; reproduce quality/performance baseline and inspect interaction/focus behavior.
2. Add same-origin production serving and an explicitly read-only public demo. Keep local mutations functional; explain public restrictions in the UI. Add bounded transport and security regression tests.
3. Fix observed lifecycle/interaction defects; remove verified unused starter assets. Preserve feature-oriented structure and design identity.
4. Run three browser engines where available, responsive/axe/keyboard checks, streaming soak, benchmarks and production smoke tests. Save after screenshots.
5. Update deployment, release notes and final checklist. Final candidate GitHub CI remains pending until the user commits/pushes; do not declare v1.0 released prematurely.

Read-only deployment is intentionally simpler than session-specific server stores. Public visitors share synthetic reads/live events; local browser preferences remain independent. Alert/simulation mutations are restricted publicly and available locally. No hosting resources will be created without separate authorization.

## Visual inspection and comparison

Captured and inspected six routes in dark/light at 375, 768 and 1440 px before and after (72 full-page images). Both matrices have zero measured horizontal page overflow. Whole-page contact sheets and individual images were reviewed. The existing source was visually coherent; no unrelated template or typography redesign was justified.

| Route          | Observed before/after result                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview       | Four/two/one metric columns, readable charts and stacked tablet panels remain intact. No clipped values or overlapping service/activity rows.                                                 |
| Event explorer | Mobile filters stack; tables scroll inside their bounded panel. Sorting, selection and pagination remain reachable. Drawer content is readable; keyboard focus/restoration is corrected.      |
| Live monitor   | Wrapping status/action rows fit mobile. Frozen screenshots show recovery/empty states; a connected-feed capture confirms event IDs wrap within rows. Clear/Pause/reset behavior is corrected. |
| Analytics      | Time/service controls and charts retain hierarchy. Service links and exact-data alternatives remain available.                                                                                |
| Alerts         | Rule/action rows wrap without overlap. Local editing remains available; public controls are disabled with an explanation. Incident detail follows refreshed state.                            |
| Settings       | Paired desktop panels become a single readable column. The public notice wraps at 375 px; local preferences remain usable while server-mutation fieldsets are disabled.                       |

Visible changes clarify synthetic data, add a restrained violet-bordered public notice and disable unavailable public mutations. The graphite/violet identity, typography, density and panel geometry are preserved. Focus improvements are behavioral. Tailwind now scans application sources only, preventing docs/audit text from generating unrelated utilities.

- [Before gallery](release-audit/before/index.html) · [After gallery](release-audit/after/index.html)
- [Desktop overview](release-audit/after/overview-dark-1440.png) · [Mobile overview](release-audit/after/overview-light-375.png)
- [Mobile event drawer](release-audit/after/event-drawer-mobile.png) · [Command dialog](release-audit/after/command-mobile.png)
- [Connected feed](release-audit/after/live-connected-mobile.png) · [API failure feedback](release-audit/after/api-error-mobile.png)
- [Public desktop settings](release-audit/after/public-settings.png) · [Public mobile settings](release-audit/after/public-settings-mobile.png)

Dialog evidence uses viewport screenshots: full-page capture can misrepresent fixed modal/backdrop positions on a scrolled document. Screenshots are review evidence, not pixel-diff golden tests. No intermediate-width defect required an additional breakpoint. Real-device testing remains unperformed.

## Corrections and remaining release gate

All baseline blockers above are addressed locally. Additional confirmed issues were native modal Tab wrapping, WebKit pointer-opener focus, stale incident acknowledgement, malformed URL error containment and Zod's CSP eval probe in Firefox. Regression tests cover the fixes. Test-harness failures and reruns are recorded in [testing.md](testing.md).

Maintainability changes are limited to a pure stream-buffer helper, runtime/static-server boundaries, browser validation bootstrap and isolated release tests. No new npm dependencies were added. Confirmed-unused `App.css`, React/Vite starter images and the unused public icon sprite were removed.

The committed flagship CI is green; **final-candidate CI still requires the owner's commit/push**. Native deployment artifacts are locally verified; external hosting is unperformed. [Deployment status](deployment.md), [performance](performance.md), [delivery report](delivery-report.md) and [release checklist](release-checklist.md) separate verified results from pending actions.

## Optional future work

Durable ingestion, auth/tenancy, replay cursors, external notification delivery, production load testing and formal assistive-technology certification remain outside this release scope.
