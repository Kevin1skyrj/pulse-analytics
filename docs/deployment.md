# Safe demonstration deployment

Status: **prepared and tested locally; not deployed**. The compiled native Node path is the verified deployment method. No account, domain, paid service or external resource was created. The Dockerfile is an optional artifact; the local Docker engine was unavailable, so an image build/run is not claimed.

## One service, one origin

`npm run build` produces the Vite SPA in `dist/` and Node server in `dist-server/`. `npm start` serves both plus `/api/*` and `/ws`. Deep links such as `/events?severity=error` fall back to the SPA; only built JS/CSS and the favicon can be served as assets. Source files, environment files and absent assets return 404. Hashed assets are immutable-cacheable; HTML is revalidated. Deploying `dist/` alone omits REST and live transport.

The browser always uses relative `/api` URLs. Its socket URL derives from `location.protocol` and `location.host`: HTTPS becomes WSS. A hosting reverse proxy terminates TLS and forwards HTTP and WebSocket upgrades to the same Node port. There are no client-side API secrets or hardcoded hosting URLs.

## Local production preview

Use Node 22.16+ on the 22 line. Stop the development API first if it occupies port 3001.

```sh
npm ci --legacy-peer-deps
npm run build
npm start
```

Visit http://127.0.0.1:3001. Defaults are mutable `local` mode, loopback binding and 5,000 seeded events. Mutable mode refuses an external bind. In PowerShell use `npm.cmd` if execution policy blocks npm's PowerShell shim.

To exercise public restrictions locally in a separate PowerShell terminal:

```powershell
$env:PULSE_MODE = 'public'
$env:PULSE_ORIGIN = 'http://127.0.0.1:4174'
$env:HOST = '127.0.0.1'
$env:PORT = '4174'
npm.cmd start
```

HTTP is allowed only for loopback smoke tests. Close this terminal afterwards so these environment overrides do not affect later local editing. Alternatively `npm run test:production` starts, checks and stops this isolated compiled public server automatically; it needs the production build and installed Chrome (bundled Chromium in CI).

## Hosting recipe: native Node web service

After the owner commits/pushes and explicitly chooses to deploy:

1. Create a Node web service from this repository and select the verified candidate commit. Avoid automatic deployment of unverified branches.
2. Use Node 22.16+ on the 22 line. Build: `npm ci --legacy-peer-deps && npm run build`. Start: `npm start`. Keep development dependencies available during build because TypeScript and Vite are build tools.
3. Set `PULSE_MODE=public`, `PULSE_ORIGIN=https://YOUR-EXACT-HOST`, `HOST=0.0.0.0`, and `PULSE_SIZE=5000`. Use the platform-provided `PORT`. Do not include a URL path, credentials, query or fragment in the origin. Use one canonical origin; update it when changing domains.
4. Configure `/api/health` as the health check. Run one instance with ephemeral storage; multiple instances have independent synthetic stores and do not provide a coherent shared session.
5. Verify the external HTTPS/WSS checklist below before sharing the URL.

Render is a suitable example: its web services bind `0.0.0.0:$PORT` and provide managed TLS ([web-service documentation](https://render.com/docs/web-services)); HTTP and WebSocket traffic use the same service port ([WebSockets](https://render.com/docs/websocket)); the health path is configurable ([health checks](https://render.com/docs/health-checks)). This recipe does not promise a free plan, uptime or pricing. No hosting plan was selected.

`.env.example` documents the values but is **not automatically loaded**. Set them in the service environment or explicitly with the shell. `PULSE_SERVE_STATIC=1` also enables built assets when launching the server directly; `npm start` already enables them through `--serve`. No secret values are needed. Never place credentials in `VITE_*` variables; those are client-visible.

Browser validation is initialized before schema imports with Zod's `jitless` option, avoiding its eval probe under the strict script policy ([Zod CSP guidance](https://zod.dev/compile)). The policy does not enable `unsafe-eval`.

## Public restriction and resource model

| Control      | Implemented behavior                                                                                                                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Writes       | Every method except GET/HEAD is rejected with 403 before routing in public mode, even for non-browser clients without Origin. No public rule editing, incident acknowledgement, dataset reset or failure injection.                |
| UI           | `/api/capabilities` drives a read-only notice and disabled mutation controls. Permission lookup failure leaves editing disabled. Theme, layout, filtering and other browser-local preferences remain usable.                       |
| Shared state | Visitors share synthetic reads and live arrivals. Public data/incident history resets every 24 hours of process uptime and on restart. Rules reset on restart. Local mode preserves editable workflows.                            |
| Origins      | Exact configured Origin for public browser requests and required exact Origin for public WebSocket upgrades. Local HTTP also checks loopback Host. This is a browser boundary, not authentication for public reads.                |
| API budget   | One bounded counter allows 600 API requests per minute per service; excess returns 429 with Retry-After. Health checks are exempt. No unbounded per-IP map. One busy visitor can consume the shared budget.                        |
| Connections  | At most 50 WebSocket clients and 100 HTTP connections; idle/dead sockets are checked by 30-second ping/pong. Socket send buffers at 1 MB trigger termination. Incoming socket data is limited to 1 KB and is not an ingestion API. |
| Data         | 100k retained events, 200 incidents, 100 local rules, 500 rows per REST page, 300 pending and displayed events per browser. HTTP mutation bodies cap at 20 KB.                                                                     |
| Headers      | CSP limits scripts to self, blocks framing/objects and restricts connections; nosniff and no-referrer are set. Inline styles remain allowed for charts and dynamic layout. TLS/HSTS policy belongs at the hosting edge.            |
| Timeouts     | 10-second request timeout, 5-second header/keepalive timeouts and at most 100 requests per HTTP connection.                                                                                                                        |

This is a bounded demonstration, not DDoS protection, durable ingestion or a multi-tenant service. Origin headers can be forged outside browsers. Read-only enforcement is therefore independent of Origin. A serious public traffic requirement needs edge controls and load testing. In-memory data intentionally disappears on restarts; there is no migration or backup requirement.

## External verification and rollback

Not performed yet; required before calling a hosted demo verified:

- `/api/health` returns 200 through HTTPS; HTTP redirects to HTTPS; inspect the actual certificate and edge TLS policy.
- Reload each deep route; confirm JS/CSS load, no console/CSP errors and no mixed content.
- Confirm the live network connection is **WSS**, receives events and reconnects after interruption.
- Confirm public notices/disabled editing; a direct POST/PATCH/PUT request receives 403.
- Check mobile layout, theme/layout persistence and a filtered investigation URL on the hosted origin.
- Confirm the service restarts cleanly and resets its synthetic data; inspect logs and resource usage.

If deployment fails, stop sharing the URL and roll back the host to a previously verified **public-safe** commit, or disable the service. Do not roll a public host back to the mutable flagship baseline. Restore the default demo by restarting the process; no durable data is lost. Keep deployments and credentials owner-controlled.

## Optional container

The multistage Dockerfile compiles assets/server, installs runtime dependencies, runs as `node`, exposes 3001 and probes `/api/health`. When a Docker engine is available:

```sh
docker build -t pulse:1.0.0-rc.1 .
docker run --rm -p 127.0.0.1:4174:3001 -e PULSE_ORIGIN=http://127.0.0.1:4174 pulse:1.0.0-rc.1
```

This loopback command tests public restrictions locally. External container hosting still needs an HTTPS/WSS proxy and the correct HTTPS origin. The image remains unverified until those build/run checks are performed.
