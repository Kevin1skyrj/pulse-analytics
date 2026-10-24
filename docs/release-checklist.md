# v1.0 release checklist

**Current status: release candidate; NOT RELEASED.** Branch: `codex/v1-release-hardening`. Baseline HEAD: `b54b2963f50ba7d3b6646e32345550b7f5c2c68d`. The user owns commits, pushes and tags. No external hosting actions were taken.

## Local gates

- [x] Inspect latest source/history/docs; start from a clean baseline and use a dedicated branch.
- [x] Preserve feature-oriented architecture; explain proposed changes before edits.
- [x] Lint and strict TypeScript checks.
- [x] 23 unit/component/API/security tests.
- [x] Production SPA and Node build.
- [x] Final 36/36 compiled browser scenarios passed; 108 axe/viewport scans across Chromium, Firefox and WebKit.
- [x] 36 before + 36 after route/theme/width captures; zero page overflow, visual inspection.
- [x] Public-mode smoke with real WS, deep-link reload, write denial, source isolation and mobile/desktop axe.
- [x] Reproduce 5k/100k benchmarks; record methodology and limits.
- [x] 180-second stream soak at 100k retention; bounded queues/client cleanup and sampled heap.
- [x] Safe public-mode configuration, reset/resource policy and native Node deployment instructions.
- [x] Correct flagship commit/CI documentation and prepare draft release notes.
- [x] Whitespace/internal-link/package consistency checks: no diff whitespace errors, 18 Markdown files checked with no broken internal links, matching package/lockfile metadata.

## Mandatory owner-controlled release gate

- [ ] Review the working-tree diff and local evidence; create focused commits and push the branch.
- [ ] Validate the basic **Pulse quality** workflow (lint, unit tests, TypeScript and build) on the final candidate SHA. Record that SHA and run URL here. Browser, smoke, benchmark and soak checks are optional local checks; basic CI does not validate them.
- [ ] Finalize package and lockfile version as `1.0.0` and remove draft wording only when ready; run the same gates on that final commit. Metadata changes still need a matching final CI run.
- [ ] Merge/release through the owner's chosen workflow; create the recommended annotated `v1.0.0` tag at the verified release commit and publish reviewed release notes.

Suggested commit grouping: (1) safe production runtime/public mode, (2) stream/incident/focus/CSP fixes and regressions, (3) audit evidence, CI and documentation. Keep tests alongside the behavior they verify. These are suggestions; no staging or commits were performed.

## Separate hosting verification

Prepared artifacts are sufficient for this local assignment; a deployed-demo claim requires owner-authorized actions:

- [ ] Select hosting/account/domain and explicitly authorize deployment.
- [ ] Verify actual HTTPS certificate/redirects, WSS transport/recovery, public mutation denial, deep links and health checks through the host.
- [ ] Record deployed SHA, public URL, logs/resource observations and a safe rollback target.
- [ ] If choosing Docker, first build/run the image; it was not verified here because the engine was unavailable.

Unperformed checks remain explicit: NVDA/VoiceOver, real devices, extended React browser heap/CLS/INP profiling, sustained concurrency and DDoS resistance. Automated axe results are not formal WCAG certification.
