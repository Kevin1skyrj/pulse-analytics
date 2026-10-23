# State ownership

| State                                                             | Owner                                               | Reason                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| Dialogs, form errors, selected event IDs, visible columns         | Local React state                                   | Limited to one interaction/screen                        |
| Event filters, sort/page/size, open event; analytic range/service | URLSearchParams                                     | Refreshable and shareable investigations                 |
| Theme, workspace name, sidebar density/collapse, widget layout    | Validated localStorage store + useSyncExternalStore | Shared, persistent browser preferences                   |
| REST snapshots and mutations                                      | TanStack Query                                      | Cancellation, caching, retries, refetch and invalidation |
| WebSocket connection, timers, pending buffers                     | useStream                                           | Different lifetime and delivery semantics from REST      |

Do not place every event or form field in a global store. The application needs no Zustand/Redux store. The preferences store has a versioned key, Zod validation, safe defaults for corrupt data, and a storage-event listener for other tabs.

Queries use a 5-second stale time, one retry and cancellation through fetch's AbortSignal. Overview, Analytics and incident history poll every 10 seconds. Query keys include the complete request path, so a changed filter cannot overwrite another filter's result. No optimistic server event counts are invented.

KPIs, filtered rows, errors and service health are derived from event data. They are not separately maintained client counters. The stream's received count intentionally counts only arrivals observed during the current visit; it is not the dashboard total.

Effects exist for external systems: socket/timer lifecycles, keyboard shortcuts, theme application, document titles and modal focus. The table virtualizer is not memoized by React Compiler (Compiler is not enabled); a documented, local lint exception covers that library API.
