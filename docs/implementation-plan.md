# Pulse flagship implementation — historical plan

## Ownership

The user owns commits and pushes. The flagship milestones below were committed at `b54b296` and passed baseline GitHub CI. This document preserves the original implementation sequence. Current release hardening and its pending gates are recorded in [release-audit.md](release-audit.md) and [release-checklist.md](release-checklist.md).

## Starting point

Module 02 at d7a1abd: responsive shell, four static metrics, local event search, section navigation, keyboard focus and skip link. Preserve these capabilities while introducing actual routes and a shared dataset.

## Architecture and design

React/Vite SPA with lazy route modules; a single local TypeScript HTTP/WebSocket server; shared Zod contracts. URL state owns explorer filters; TanStack Query owns REST data; component state owns dialogs and forms; localStorage owns validated preferences/layout; a dedicated hook owns streaming connection and bounded buffers.

Dark graphite surfaces, violet accent, semantic severity colors, compact typography, 4px spacing scale, restrained 8px corners. Light theme uses the same semantic tokens. Native dialogs supply modal focus containment; keyboard alternatives accompany dragging.

## Milestones

1. Tokens, shared UI, routing and responsive shell.
2. Deterministic data contracts and overview/analytics visualization.
3. Local REST service, validation, latency/failure controls and query integration.
4. Event investigation with URL filters, pagination, virtualization and detail drawer.
5. WebSocket simulation, bounded buffering, pause and recovery.
6. Alert rules, evaluation, incident history and acknowledgement.
7. Persistent layout, command palette and workspace preferences.
8. Accessibility, performance measurements and failure recovery.
9. Unit/component/E2E checks, CI, implementation-specific docs and final visual review.

The data contract is established before chart integration to avoid unrelated KPI and chart fixtures. Tests are added with behaviors, rather than deferred entirely to milestone 9.

## Dependency decisions

React Router: routes/URL state. TanStack Query: cancellation/cache/mutations. TanStack Virtual: bounded DOM. Recharts: responsive accessible charts. Lucide: consistent icons. Zod: runtime contracts. ws: actual WebSockets. tsx/concurrently: portable local development. Vitest/Testing Library: meaningful behavior tests. Playwright: critical browser flows. No global state store, table framework, authentication or hosted services needed.

## Verification gate

Lint, strict type checks, unit/component tests, production build, browser flows, mobile/tablet/desktop review, deterministic 100k-event benchmark, and documentation of actual results and limitations.

## Completion

All nine flagship milestones are implemented and committed. Verification and limitations are recorded in delivery-report.md, testing.md and performance.md. All eleven requested technical documents are present. The current hardening branch is a separate, owner-controlled release candidate; it is not a completed v1.0 release.
