# Performance: release candidate measurements

Measured on 24 October 2026, Windows, Node v22.16.0, local machine. Run `npm run benchmark` to reproduce. Seed 20261024, fixed 48-hour history, 12 sequential samples per dataset, no injected latency or network transport. Generation is timed once. Each sample filters error events, sorts by duration (timestamp tie-break), takes a 100-row page, and computes the full 24-hour summary. Median is the mean of the two middle samples; p95 is the nearest-rank value (the maximum of these 12 samples).

| Events  | Generation | Combined median | Combined p95 |
| ------- | ---------: | --------------: | -----------: |
| 5,000   |   13.53 ms |         6.13 ms |     16.69 ms |
| 100,000 |  122.96 ms |       139.08 ms |    182.34 ms |

These are local CPU timings, not API response latency, browser frame rates, throughput under concurrency or production SLAs. Twelve samples are a small baseline and vary with machine load. The final benchmark ran after the build with no concurrent browser suite. At the beginning of this audit, baseline `b54b296` measured 5k median/p95 6.60/17.21 ms and 100k 159.86/188.75 ms. The data algorithm did not materially change; this variation is not evidence of an optimization speedup. Raw final values are in [benchmark.json](release-audit/benchmark.json). The former Module 02 static shell had no equivalent workload.

## Work avoided and bounds verified

- The server sends at most 500 events per page, even if a larger size is requested. Filtering is O(n); sorting the filtered result is O(k log k). Aggregation scans retained data. There is no indexing or worker pool.
- TanStack Virtual mounts viewport rows plus six overscan rows on each side. A browser test with 100,000 retained events and a 500-row page verified fewer than 35 table rows in the DOM, then navigated to page 2 of 200. It did not render 100,000 elements or transfer all events to the browser.
- Stable event IDs are row keys. Fixed row heights and chart containers keep layout predictable. Compact rows use a matching virtualizer estimate.
- AbortSignal cancels obsolete fetches; full query paths separate filter cache entries. Summary polling is ten seconds, rather than one render per incoming event.
- Route modules are lazy. Chart code is shared by Overview/Analytics and is not required for an initial Event explorer route.
- WebSocket display and pending queues each cap at 300; rendering flushes every 500 ms. Server history caps at 100,000 events, incident history at 200, and slow socket clients are disconnected when their send buffer exceeds 1 MB.
- Chart animations are disabled for frequently refreshed operational data. There are no remote image/font requests; the only branding asset is a small SVG.

## Production bundle baseline

Vite 8.3.5 production build; sizes reported by Vite, decimal kB. Selected chunks, not an additive per-route network budget:

| Asset            |       Raw |      gzip |
| ---------------- | --------: | --------: |
| Main application | 404.15 kB | 125.05 kB |
| Shared charts    | 378.10 kB | 108.58 kB |
| Event explorer   |  41.39 kB |  12.31 kB |
| Styles           |  19.50 kB |   5.33 kB |

The chart dependency is a substantial cost. Lazy loading isolates it; it does not eliminate the cost on the dashboard. The shell now reads capabilities, bringing the shared API code into the initial chunk. Zod uses its non-JIT browser parser to respect CSP. Tailwind source detection is limited to `src`, avoiding utility generation from docs/audit files. Future work should profile real navigation and React commits before adding memoization or changing libraries. No Lighthouse, INP, low-end device or concurrent-user benchmark is claimed.

## Streaming soak and cleanup

`npm run test:soak` starts an isolated real HTTP/WebSocket server with 100,000 events and a Node client using the same pure bounded-buffer utility as the UI. It runs at the default three events/second for 180 seconds, reconnects twice, explicitly requests GC and samples every 30 seconds. [Raw report](release-audit/stream-soak.json).

- 531 events received; final displayed buffer 300; server history stayed at 100,000 throughout.
- One connected client at every sample; zero after the final close.
- Combined server/client post-GC heap: 54.01 MiB initially, then 52.72, 52.75, 52.87, 52.87, 52.91 and 52.90 MiB. No sustained growth appeared in this sample.
- Hook regression tests separately verify pending arrivals are discarded by Clear/Pause/reset, and socket handlers/reconnect/flush timers stop after unmount. Browser tests exercise actual pause/reconnect/reset behavior.

This is a short stability observation, not proof of leak freedom over days. It measures the Node process, not React/browser heap, detached DOM or garbage-collection pauses. Server copying/filtering/sorting remains synchronous and O(n) or O(k log k); 100k is a deliberate demo ceiling. The public service-wide request budget bounds work but does not establish high-concurrency capacity. Layout stability was visually inspected with fixed chart/row dimensions; no numerical CLS or render-profiler claim is made.
