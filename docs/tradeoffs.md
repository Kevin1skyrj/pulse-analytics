# Decisions and limitations

1. **Local simulation, not production ingestion.** Node HTTP and ws provide genuine transport without an infrastructure project. Loopback binding and origin checks limit accidental access. There is no identity, tenancy, rate limiting or durable database; do not expose it publicly as a production API.
2. **Shared deterministic source.** One event store powers every aggregate. Fixed seed/clock support reproducible demonstrations. Simulation ticks advance that clock, so independent snapshots can differ while streaming is enabled. Freeze streaming when comparing exact values.
3. **Server pagination plus virtualization.** Filtering/sorting stays on the server and responses are capped at 500. Virtualization bounds rendered rows. Offset pagination can shift when new events arrive; a production immutable/cursor snapshot is a future improvement.
4. **Explicit data retention.** The server keeps 100k events and 200 incidents; the live view keeps 300. Old event deep links can return 404. No automatic websocket cursor replay: investigate missed intervals through REST while retained.
5. **Browser preferences, in-memory rules.** Layout/theme survive reloads in the same browser. Rules and history survive route navigation but reset on server restart. No external notification delivery is claimed.
6. **Native drag plus buttons.** Desktop HTML dragging avoids another dependency. Buttons support mobile/keyboard reordering. Width toggles resize within the grid; no arbitrary freeform resizing.
7. **Recharts.** A charting dependency provides responsive plots, tooltips and accessible interaction. It is isolated in a lazy shared chart chunk; it is a meaningful bundle cost, recorded in performance documentation.
8. **Small shared UI.** Native dialogs and semantic components avoid a full design-system framework. Focus and error behavior are tested, rather than assumed from appearance.
9. **No global app-state library.** Local state, URL state, TanStack Query and a small preferences subscription cover the actual ownership needs.
10. **Quality claims are bounded.** Measurements are from local Windows/Chrome. CI configuration is provided but has not run remotely because this work is not committed or pushed. Browser and accessibility checks do not establish a formal WCAG certification.

The npm 11.4 peer resolver crashed during dependency installation. The lockfile was generated with `--legacy-peer-deps`; use the documented install command. Direct dependency versions, strict builds and tests are checked rather than assuming installation alone proves compatibility.
