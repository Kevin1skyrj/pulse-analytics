import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
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

export function createPulseServer(size = 5000) {
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
    const url = new URL(req.url || "/", "http://localhost"),
      path = url.pathname;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    const reply = (status: number, data: unknown) => {
      res.writeHead(status);
      res.end(JSON.stringify(data));
    };
    try {
      // No credentials or cross-origin access: this demo binds to loopback only.
      if (
        req.headers.origin &&
        !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)
      )
        return reply(403, { message: "Local workspace access only" });
      const read = async () => {
        let body = "";
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 20000) throw new Error("Request body too large");
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
        sequence = 0;
        incidents = [];
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
        const rule = {
          ...ruleInput.parse(await read()),
          id: crypto.randomUUID(),
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
        incident.state = z
          .object({ state: z.enum(["acknowledged", "resolved"]) })
          .parse(await read()).state;
        return reply(200, incident);
      }
      reply(404, { message: "Endpoint not found" });
    } catch (error) {
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
  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket) => {
    if (!simulation.streaming) socket.close(1012, "Simulation disconnected");
  });
  const timer = setInterval(() => {
    if (!simulation.streaming) return;
    const timestamp =
      Date.parse(events.at(-1)?.timestamp || DEFAULT_ANCHOR) + 1000;
    const batch = generateEvents(3, SEED + ++sequence, timestamp).map(
      (e, index) => ({
        ...e,
        timestamp: new Date(timestamp).toISOString(),
        id: `live-${sequence}-${index}`,
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
    });
  }, 1000);
  server.on("close", () => clearInterval(timer));
  return {
    server,
    close: () => {
      clearInterval(timer);
      wss.clients.forEach((c) => c.terminate());
      wss.close();
      server.close();
    },
  };
}
