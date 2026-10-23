# Interview defense

**What makes this more than a dashboard mockup?** The browser calls a real local REST/WebSocket service. Charts, KPIs, filters and alert evaluation share one seeded dataset. Scenarios deliberately exercise failures and reconnection.

**Where does state belong?** Unsaved forms and dialogs stay local; investigations live in the URL; server snapshots live in TanStack Query; preferences persist locally; streaming transport has its own lifecycle. This prevents a single global store becoming the owner of unrelated lifetimes.

**How do you handle 100,000 events?** The server filters and sorts, sends at most 500 rows per page, and the UI virtualizes that page. I measured data-processing time and verified the rendered DOM remained bounded. I do not claim the browser renders all 100k simultaneously.

**Why both pagination and virtualization?** Pagination bounds transfer/cache size; virtualization bounds mounted DOM. These address different costs.

**How do you prevent stale searches?** Query keys include filters, and the query function passes AbortSignal to fetch. A slow prior request cannot replace the current filter's cache entry.

**What does active users mean?** Unique synthetic user IDs within the selected time window. It is a precisely defined demo KPI, not an assertion about current connected sessions.

**How are charts kept honest?** Aggregates are computed from the same events and window. Tests reconcile bucket, service and severity totals with KPI counts. There are no independent random chart fixtures.

**How does reconnection work?** A bounded exponential schedule increases from 1 to 30 seconds, stops after eight automatic attempts, and resets after a valid batch. Timers and sockets are cleaned up on unmount. The UI reports the connection state and allows manual retry.

**What happens on pause?** The connection remains open and received count increases; paused arrivals are omitted from the visual feed. Resume receives future arrivals. Missing intervals remain searchable in retained server data.

**Why cap buffers?** A real-time tab may stay open for hours. The display and pending queues both cap at 300; server history caps at 100k. Bounded memory matters more than showing every old row.

**Why native dialogs?** showModal provides a platform top layer, inert background and focus containment. I add naming, Escape/Close behavior and trigger restoration, and verify them in browser tests.

**What is the alert policy?** Count events at or above a severity in a sliding simulated time window. Open one unresolved incident at the threshold; resolve below it. Manual resolution may retrigger while breached. No external notification service is fabricated.

**What would you change for production?** Durable ingest/storage, authentication and tenancy, rate limiting, cursor-based queries, resilient replay, operational metrics, deployment hardening and broader browser/assistive-technology validation. Those are explicit limits of this frontend-focused demonstration.

**Why not memoize everything?** Memoization has costs and can conceal incorrect ownership. Route splitting, server filtering, bounded buffers and virtualization solve identified costs; add memoization only after profiling a concrete bottleneck.

**How do you defend performance claims?** State the dataset, seed, runtime, operations, sample count and observed values. Do not equate a local CPU benchmark with network latency, production scale or a universal frame-rate guarantee.
