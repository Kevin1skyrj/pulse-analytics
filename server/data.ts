import { randomUUID } from "node:crypto";
import {
  services,
  severities,
  type PulseEvent,
  type Rule,
  type Incident,
  type Summary,
} from "../shared/contracts.js";

export const SEED = 20261024;
export const DEFAULT_ANCHOR = "2026-10-24T12:00:00.000Z";
export function generateEvents(
  size = 5000,
  seed = SEED,
  anchor = Date.parse(DEFAULT_ANCHOR),
): PulseEvent[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: size }, (_, i) => {
    // Monotonic arrival curve creates repeatable daily traffic peaks, without shuffled timestamps.
    const progress = (i + 1) / size;
    const arrival =
      progress +
      0.035 * Math.sin(4 * Math.PI * progress) +
      0.008 * Math.sin(12 * Math.PI * progress);
    const service = services[Math.floor(random() * services.length)];
    const chance = random();
    const severity =
      chance < 0.012
        ? "critical"
        : chance < (service === "payments" ? 0.16 : 0.055)
          ? "error"
          : chance < 0.22
            ? "warning"
            : "info";
    return {
      id: `evt-${seed}-${i.toString().padStart(6, "0")}`,
      timestamp: new Date(
        anchor - 48 * 3600000 + arrival * 48 * 3600000,
      ).toISOString(),
      service,
      severity,
      status:
        severity === "critical" || severity === "error"
          ? "failed"
          : severity === "warning"
            ? "pending"
            : "processed",
      message:
        severity === "critical"
          ? "Circuit breaker opened"
          : severity === "error"
            ? "Request exceeded timeout"
            : severity === "warning"
              ? "Elevated response latency"
              : [
                  "Request completed",
                  "Session authenticated",
                  "Event delivered",
                ][i % 3],
      userId: `usr-${Math.floor(random() * Math.max(20, size / 5))}`,
      duration: Math.round(20 + random() * (severity === "info" ? 200 : 1800)),
      metadata: {
        region: ["ap-south-1", "eu-west-1", "us-east-1"][i % 3],
        traceId: `tr-${seed}-${i}`,
        method: i % 2 ? "GET" : "POST",
        retryable: severity !== "info",
      },
    };
  });
}

export function filterEvents(events: PulseEvent[], params: URLSearchParams) {
  const q = (params.get("q") || "").toLowerCase().trim();
  const service = params.get("service"),
    severity = params.get("severity"),
    status = params.get("status");
  const from = params.get("from"),
    to = params.get("to");
  return events.filter(
    (e) =>
      (!q ||
        `${e.id} ${e.message} ${e.service} ${e.severity} ${e.status}`
          .toLowerCase()
          .includes(q)) &&
      (!service || e.service === service) &&
      (!severity || e.severity === severity) &&
      (!status || e.status === status) &&
      (!from || e.timestamp >= from) &&
      (!to || e.timestamp <= to),
  );
}

export function eventPage(events: PulseEvent[], params: URLSearchParams) {
  const filtered = filterEvents(events, params);
  const sort = params.get("sort") || "timestamp",
    ascending = params.get("order") === "asc";
  filtered.sort((a, b) => {
    const compare = (field: string) =>
      field === "duration"
        ? a.duration - b.duration
        : field === "severity"
          ? severities.indexOf(a.severity) - severities.indexOf(b.severity)
          : a.timestamp.localeCompare(b.timestamp);
    const diff = compare(sort) || compare(params.get("then") || "timestamp");
    return (ascending ? diff : -diff) || a.id.localeCompare(b.id);
  });
  const integer = (value: string | null, fallback: number) =>
    Number.isFinite(Number(value)) && Number(value) > 0
      ? Math.floor(Number(value))
      : fallback;
  const size = Math.max(1, Math.min(500, integer(params.get("size"), 100)));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(pages, Math.max(1, integer(params.get("page"), 1)));
  return {
    items: filtered.slice((page - 1) * size, page * size),
    total: filtered.length,
    page,
    pages,
  };
}

export function summarize(
  events: PulseEvent[],
  hours: number,
  service = "",
): Summary {
  const end = events.length
    ? Date.parse(events[events.length - 1].timestamp)
    : Date.parse(DEFAULT_ANCHOR);
  const span = hours * 3600000,
    start = end - span;
  const matching = events.filter((e) => !service || e.service === service);
  const current = matching.filter(
    (e) => Date.parse(e.timestamp) > start && Date.parse(e.timestamp) <= end,
  );
  const previous = matching.filter(
    (e) =>
      Date.parse(e.timestamp) > start - span &&
      Date.parse(e.timestamp) <= start,
  );
  const isError = (e: PulseEvent) =>
    e.severity === "error" || e.severity === "critical";
  const errors = current.filter(isError).length;
  const buckets = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(start + (i * span) / 24).toISOString(),
    events: 0,
    errors: 0,
  }));
  current.forEach((e) => {
    const bucket =
      buckets[
        Math.min(
          23,
          Math.max(
            0,
            Math.floor((Date.parse(e.timestamp) - start) / (span / 24)),
          ),
        )
      ];
    bucket.events++;
    if (isError(e)) bucket.errors++;
  });
  return {
    total: current.length,
    users: new Set(current.map((e) => e.userId)).size,
    errors,
    errorRate: current.length ? (errors / current.length) * 100 : 0,
    throughput: current.length / (hours * 60),
    previousTotal: previous.length,
    previousErrorRate: previous.length
      ? (previous.filter(isError).length / previous.length) * 100
      : 0,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    buckets,
    services: services
      .filter((s) => !service || s === service)
      .map((name) => {
        const subset = current.filter((e) => e.service === name),
          count = subset.filter(isError).length;
        return {
          name,
          total: subset.length,
          errors: count,
          health: !subset.length
            ? "no data"
            : count / subset.length > 0.1
              ? "degraded"
              : "healthy",
        };
      }),
    severity: severities.map((name) => ({
      name,
      value: current.filter((e) => e.severity === name).length,
    })),
    recent: current.slice(-6).reverse(),
  };
}

export function evaluateRules(
  rules: Rule[],
  events: PulseEvent[],
  history: Incident[],
  now: number,
): Incident[] {
  const created: Incident[] = [];
  rules
    .filter((r) => r.enabled)
    .forEach((rule) => {
      const count = events.filter(
        (e) =>
          Date.parse(e.timestamp) > now - rule.windowMinutes * 60000 &&
          Date.parse(e.timestamp) <= now &&
          (rule.service === "all" || e.service === rule.service) &&
          severities.indexOf(e.severity) >= severities.indexOf(rule.severity),
      ).length;
      const existing = history.find(
        (i) => i.ruleId === rule.id && i.state !== "resolved",
      );
      if (count >= rule.threshold && !existing)
        created.push({
          id: `inc-${randomUUID()}`,
          ruleId: rule.id,
          name: rule.name,
          timestamp: new Date(now).toISOString(),
          count,
          state: "open",
        });
      if (count < rule.threshold && existing) existing.state = "resolved";
    });
  return created;
}
