# Performance: measured baseline

Measured on 24 October 2026, Windows, Node v22.16.0, local machine. Run `npm run benchmark` to reproduce. Seed 20261024, fixed 48-hour history, 12 sequential samples per dataset, no injected latency or network transport. Generation is timed once. Each sample filters error events, sorts by duration (timestamp tie-break), takes a 100-row page, and computes the full 24-hour summary. Median is the mean of the two middle samples; p95 is the nearest-rank value (the maximum of these 12 samples).

| Events  | Generation | Combined median | Combined p95 |
| ------- | ---------: | --------------: | -----------: |
| 5,000   |    9.10 ms |         6.16 ms |     18.04 ms |
| 100,000 |  122.27 ms |       153.37 ms |    192.64 ms |

These are local CPU timings, not API response latency, browser frame rates, throughput under concurrency or production SLAs. Twelve samples are a small baseline and vary with machine load. The former Module 02 static shell had no equivalent workload; no before/after speedup is claimed.

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
| Main application | 391.90 kB | 121.10 kB |
| Shared charts    | 378.10 kB | 108.58 kB |
| Event explorer   |  41.40 kB |  12.32 kB |
| Styles           |  21.15 kB |   5.62 kB |

The chart dependency is a substantial cost. Lazy loading isolates it; it does not eliminate the cost on the dashboard. Future work should profile real navigation and React commits before adding memoization or changing libraries. No Lighthouse, INP, long-duration heap, low-end device or concurrent-user benchmark is claimed.
