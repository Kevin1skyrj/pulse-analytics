# Pulse v1.0.0 — draft release notes

**Draft only.** Candidate package version: `1.0.0-rc.1`. Recommended final tag: **`v1.0.0`**, after the owner commits/pushes the reviewed candidate, its GitHub Actions run passes, and release metadata is finalized. No tag or release has been created.

Pulse brings event investigation, operational charts, live monitoring and incident workflows into one responsive React workspace backed by a coherent synthetic dataset.

## Included in v1

- Six lazy routes: Overview, Event Explorer, Live Monitor, Analytics, Alerts and Settings; dark/light themes, mobile navigation and command entry.
- Shareable URL investigations, combined filters, sorting, paginated virtual tables, selection/copy and event details.
- Actual REST/WebSocket transport, derived KPIs/charts, bounded live buffers and reconnect behavior; deterministic 5k/100k datasets.
- Editable local alerts/incidents and failure-injection controls; persistent browser preferences and dashboard customization with keyboard alternatives.
- A compiled single-service deployment path with SPA fallback, health checks and an explicitly read-only public demo policy.

## Release hardening

Fixed queued arrivals surviving Clear/Pause, live IDs repeating after reset, stale incident transitions, cross-engine modal focus, malformed request URL handling and Firefox CSP errors from validation initialization. Added HTTP/WS origin checks, public write denial, resource caps, heartbeat/backpressure handling, runtime configuration validation and safe asset serving. Removed unused starter assets and scoped Tailwind detection to application sources.

Verification expands to 23 unit/component/API/security tests and 36 browser scenarios across Chromium, Firefox and WebKit, including 108 route/theme/width accessibility scans, public production smoke and a three-minute 100k stream soak. [Actual outcomes and limitations](testing.md) govern these claims. The visual identity is preserved, with clear public-demo feedback and before/after screenshot evidence.

## Known limits

All data is synthetic and in memory. Public visitors share read-only data; local editing requires loopback mode. There is no auth, durable ingest, external notification delivery, cursor replay or multi-instance consistency. A 100k CPU benchmark is not a hosted latency guarantee. Screen-reader/real-device, high-concurrency and extended browser-heap checks remain future work. No hosted deployment or Docker image verification is claimed.

## Upgrade and release operation

Use Node 22.16+ on the Node 22 line and `npm ci --legacy-peer-deps`. Build both parts with `npm run build`; `npm start` serves them together. Public hosting must use `PULSE_MODE=public` and the exact HTTPS `PULSE_ORIGIN`; see [deployment.md](deployment.md). Do not expose the mutable flagship baseline. Review [release-checklist.md](release-checklist.md) before changing the package version to 1.0.0 or creating the tag.
