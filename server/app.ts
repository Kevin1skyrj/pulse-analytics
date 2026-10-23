import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { serveStatic } from "./static.js";
import {
  ruleInput,
  simulationSchema,
  type Rule,
  type Incident,
  type Simulation,
} from "../shared/contracts.js";
import {
  generateEvents,
  eventPage,
  summarize,
  evaluateRules,
  SEED,
  DEFAULT_ANCHOR,
} from "./data.js";

export type ServerOptions = {
  publicDemo?: boolean;
  origin?: string;
  staticDir?: string;
  tickMs?: number;
  maxClients?: number;
  apiBudget?: number;
};
export function createPulseServer(size = 5000, options: ServerOptions = {}) {
  const publicDemo = options.publicDemo ?? false;
  if (publicDemo && !options.origin)
    throw new Error("Public mode requires an exact origin");
  const maxClients = options.maxClients ?? 50;
  let epoch = randomUUID(),
    budgetStart = Date.now(),
    budgetUsed = 0;
  const allowedOrigin = (origin: string | undefined, socket = false) =>
    origin
      ? publicDemo
        ? origin === options.origin
        : /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      : !(publicDemo && socket);
  let events = generateEvents(size),
    sequence = 0,
    requests = 0;
  const rules: Rule[] = [
    {
      id: "rule-payments",
      name: "Payment failures",
      service: "payments",
      severity: "error",
      threshold: 3,
      windowMinutes: 60,
      enabled: true,
    },
  ];
  let incidents: Incident[] = [];
  let simulation: Simulation = { latency: 120, failEvery: 0, streaming: true };
  const evaluate = () => {
    incidents = [
      ...evaluateRules(
        rules,
        events,
        incidents,
        Date.parse(events.at(-1)?.timestamp || DEFAULT_ANCHOR),
      ),
      ...incidents,
    ].slice(0, 200);
  };
  evaluate();
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const reply = (status: number, data: unknown) => {
      if (res.destroyed) return;
      res.writeHead(status);
      res.end(req.method === "HEAD" ? undefined : JSON.stringify(data));
    };
    try {
      const url = new URL(req.url || "/", "http://localhost"),
        path = url.pathname;
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${options.origin?.replace(/^http/, "ws") || "ws://127.0.0.1:* ws://localhost:*"}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`,
      );
      if (!allowedOrigin(req.headers.origin))
        return reply(403, { message: "Origin not allowed" });
      if (
        !publicDemo &&
        !["localhost", "127.0.0.1", "[::1]"].includes(
          new URL(`http://${req.headers.host}`).hostname,
        )
      )
        return reply(403, { message: "Local workspace host only" });
      if (publicDemo && !["GET", "HEAD"].includes(req.method || ""))
        return reply(403, {
          message:
            "Public demo is read-only. Run Pulse locally to change rules or simulation data.",
        });
      if (!path.startsWith("/api/")) {
        if (!["GET", "HEAD"].includes(req.method || ""))
          return reply(405, { message: "Method not allowed" });
        if (
          options.staticDir &&
          (await serveStatic(
            path,
            options.staticDir,
            res,
            req.method === "HEAD",
          ))
        )
          return;
        return reply(404, { message: "Not found" });
      }
      const methods =
        path === "/api/rules"
          ? ["GET", "POST"]
          : path.startsWith("/api/rules/")
            ? ["PUT"]
            : path.startsWith("/api/incidents/") || path === "/api/simulation"
              ? ["GET", "PATCH"]
              : path === "/api/dataset"
                ? ["POST"]
                : ["GET", "HEAD"];
      if (!methods.includes(req.method || "")) {
        res.setHeader("Allow", methods.join(", "));
        return reply(405, { message: "Method not allowed" });
      }
      if (publicDemo && path !== "/api/health") {
        if (Date.now() - budgetStart >= 60000) {
          budgetStart = Date.now();
          budgetUsed = 0;
        }
        if (++budgetUsed > (options.apiBudget ?? 600)) {
          res.setHeader("Retry-After", "60");
          return reply(429, {
            message: "Demo request budget reached. Retry in one minute.",
          });
        }
      }
      if (path === "/api/capabilities")
        return reply(200, {
          mode: publicDemo ? "public" : "local",
          mutations: !publicDemo,
        });
      const read = async () => {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 20000) {
            reply(413, { message: "Request body too large" });
            throw new Error("body limit");
          }
        }
        return JSON.parse(body || "{}") as unknown;
      };
      if (path !== "/api/simulation" && path !== "/api/health") {
        await new Promise((resolve) => setTimeout(resolve, simulation.latency));
        requests++;
        if (simulation.failEvery && requests % simulation.failEvery === 0)
          return reply(503, {
            message:
              "Simulated service failure. Retry or reset failures in Settings.",
          });
      }
      if (path === "/api/health") return reply(200, { ok: true });
      if (path === "/api/simulation") {
        if (req.method === "PATCH") {
          simulation = simulationSchema.parse(await read());
          if (!simulation.streaming)
            wss.clients.forEach((client) =>
              client.close(1012, "Simulation disconnected"),
            );
        }
        return reply(200, {
          ...simulation,
          seed: SEED,
          size: events.length,
          anchor: events.at(-1)?.timestamp || DEFAULT_ANCHOR,
        });
      }
      if (path === "/api/dataset" && req.method === "POST") {
        const input = z
          .object({
            size: z.union([z.literal(0), z.literal(5000), z.literal(100000)]),
          })
          .parse(await read());
        events = generateEvents(input.size);
        epoch = randomUUID();
        sequence = 0;
        incidents = [];
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify({ type: "reset" }));
        });
        evaluate();
        return reply(200, { size: events.length });
      }
      if (path === "/api/events")
        return reply(200, eventPage(events, url.searchParams));
      if (path.startsWith("/api/events/")) {
        const event = events.find(
          (e) => e.id === decodeURIComponent(path.slice(12)),
        );
        return reply(
          event ? 200 : 404,
          event || { message: "Event no longer retained" },
        );
      }
      if (path === "/api/summary") {
        const hours = z.coerce
          .number()
          .pipe(z.union([z.literal(1), z.literal(6), z.literal(24)]))
          .parse(url.searchParams.get("hours") || 24);
        return reply(
          200,
          summarize(events, hours, url.searchParams.get("service") || ""),
        );
      }
      if (path === "/api/rules" && req.method === "GET")
        return reply(200, rules);
      if (path === "/api/rules" && req.method === "POST") {
        if (rules.length >= 100)
          return reply(409, {
            message:
              "Demo limit: 100 rules. Restart the local server to reset rules.",
          });
        const rule = {
          ...ruleInput.parse(await read()),
          id: randomUUID(),
        };
        rules.push(rule);
        evaluate();
        return reply(201, rule);
      }
      if (path.startsWith("/api/rules/") && req.method === "PUT") {
        const i = rules.findIndex((r) => r.id === path.slice(11));
        if (i < 0) return reply(404, { message: "Rule not found" });
        rules[i] = { ...ruleInput.parse(await read()), id: rules[i].id };
        evaluate();
        return reply(200, rules[i]);
      }
      if (path === "/api/incidents") {
        evaluate();
        return reply(200, incidents);
      }
      if (path.startsWith("/api/incidents/") && req.method === "PATCH") {
        const incident = incidents.find((i) => i.id === path.slice(15));
        if (!incident) return reply(404, { message: "Incident not found" });
        const state = z
          .object({ state: z.enum(["acknowledged", "resolved"]) })
          .parse(await read()).state;
        if (state === "acknowledged" && incident.state !== "open")
          return reply(409, {
            message:
              "Only open incidents can be acknowledged. Refresh the incident history.",
          });
        incident.state = state;
        return reply(200, incident);
      }
      reply(404, { message: "Endpoint not found" });
    } catch (error) {
      if (res.headersSent || res.destroyed) return;
      reply(400, {
        message:
          error instanceof z.ZodError
            ? error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : "Invalid request",
      });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 5000;
  server.maxConnections = 100;
  server.maxRequestsPerSocket = 100;
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 1024,
    perMessageDeflate: false,
  });
  server.on("upgrade", (req, socket, head) => {
    if (
      req.url !== "/ws" ||
      !allowedOrigin(req.headers.origin, true) ||
      wss.clients.size >= maxClients
    ) {
      socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      return;
    }
    wss.handleUpgrade(req, socket, head, (client) =>
      wss.emit("connection", client, req),
    );
  });
  const alive = new Set<WebSocket>();
  wss.on("connection", (socket) => {
    alive.add(socket);
    socket.on("pong", () => alive.add(socket));
    socket.on("close", () => alive.delete(socket));
    socket.on("error", () => socket.terminate());
    socket.on("message", () =>
      socket.close(1008, "Server-to-client stream only"),
    );
    if (!simulation.streaming) socket.close(1012, "Simulation disconnected");
  });
  const heartbeat = setInterval(
    () =>
      wss.clients.forEach((client) => {
        if (!alive.has(client)) {
          client.terminate();
          return;
        }
        alive.delete(client);
        client.ping();
      }),
    30000,
  );
  const reset = publicDemo
    ? setInterval(() => {
        events = generateEvents(size);
        epoch = randomUUID();
        sequence = 0;
        incidents = [];
        evaluate();
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify({ type: "reset" }));
        });
      }, 24 * 3600000)
    : undefined;
  const timer = setInterval(() => {
    if (!simulation.streaming) return;
    const timestamp =
      Date.parse(events.at(-1)?.timestamp || DEFAULT_ANCHOR) + 1000;
    const batch = generateEvents(3, SEED + ++sequence, timestamp).map(
      (e, index) => ({
        ...e,
        timestamp: new Date(timestamp).toISOString(),
        id: `live-${epoch}-${sequence}-${index}`,
      }),
    );
    events = [...events, ...batch].slice(-100000);
    evaluate();
    const payload = JSON.stringify({ type: "events", events: batch });
    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.bufferedAmount < 1000000
      )
        client.send(payload);
      else if (client.bufferedAmount >= 1000000) client.terminate();
    });
  }, options.tickMs ?? 1000);
  const clearTimers = () => {
    clearInterval(timer);
    clearInterval(heartbeat);
    clearInterval(reset);
  };
  server.on("close", clearTimers);
  return {
    server,
    diagnostics: () => ({
      events: events.length,
      incidents: incidents.length,
      rules: rules.length,
      clients: wss.clients.size,
    }),
    close: () => {
      clearTimers();
      wss.clients.forEach((c) => c.terminate());
      wss.close();
      server.close();
      server.closeAllConnections();
    },
  };
}
