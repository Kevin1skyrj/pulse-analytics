# Data flow and contracts

Generation uses an LCG seed **20261024** and a fixed starting anchor **2026-10-24T12:00:00.000Z**. The default history contains 5,000 events over 48 hours. A monotonic periodic arrival curve creates reproducible traffic peaks. Services, duration, severity, users and metadata derive from the seed. Selecting the 100,000-event dataset is reproducible with the same configuration.

The simulation clock advances one second per stream tick, not with the wall-clock date. Three events are appended per tick. Setting streaming off freezes that clock. Loading a dataset resets the clock and incident history; it preserves rules. The server caps retained history at 100,000 events.

## REST surface

| Endpoint                                         | Behavior                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `GET /api/events`                                | Search, service/severity/status/date filters, sorting, page/size; size capped at 500 |
| `GET /api/events/:id`                            | Event details or 404 if no longer retained                                           |
| `GET /api/summary?hours=24&service=payments`     | Consistent metrics, 24 buckets, distributions and recent events                      |
| `GET/POST /api/rules`, `PUT /api/rules/:id`      | Validated rule listing, creation and replacement                                     |
| `GET /api/incidents`, `PATCH /api/incidents/:id` | Incident history and acknowledgement/resolution                                      |
| `GET/PATCH /api/simulation`                      | Latency, every-Nth-request failures, stream enabled state                            |
| `POST /api/dataset`                              | Load 0, 5,000 or 100,000 events                                                      |
| `GET /api/health`                                | Health probe exempt from simulated failures                                          |
| `WS /ws`                                         | Validated `{type: 'events', events: PulseEvent[]}` batches                           |

Summary windows are `(end - span, end]`; the comparison is the preceding equal window. Error rate means `(error + critical) / event count`. Active users means distinct user IDs. Throughput means events per minute across the entire selected span. Service health is degraded above 10% errors, healthy at or below it, and "no data" for empty services. These are explicit demo policies.

Alerts count events at or above their severity within a sliding window relative to the simulation clock. A rule opens one unresolved incident, resolves it below threshold, and may reopen after manual resolution if still breached. Disabling a rule stops evaluation; it does not erase history. History is capped at 200.

## Streaming recovery

The browser batches incoming events every 500 ms, retains 300 displayed events, and bounds pending events to 300. Pausing keeps connection/counting active but drops paused arrivals from the visual feed. Resume shows subsequent arrivals. Recovery backs off 1, 2, 4, 8, 16, then 30 seconds, with eight automatic attempts; a valid batch resets the attempt count. Reconnect manually restarts the attempt budget. Missed intervals can be investigated in the retained REST dataset; there is no automatic cursor replay protocol.
