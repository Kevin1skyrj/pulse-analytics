import { describe, expect, it } from "vitest";
import {
  generateEvents,
  filterEvents,
  eventPage,
  summarize,
  evaluateRules,
  DEFAULT_ANCHOR,
} from "./data.js";
import { eventSchema, type Rule } from "../shared/contracts.js";
describe("deterministic data and consistent aggregates", () => {
  const events = generateEvents();
  it("reproduces the seed with valid contracts and unique chronological IDs", () => {
    expect(generateEvents(10)).toEqual(generateEvents(10));
    expect(new Set(events.map((e) => e.id)).size).toBe(5000);
    events.forEach((event) =>
      expect(eventSchema.safeParse(event).success).toBe(true),
    );
    expect(events[0].timestamp < events.at(-1)!.timestamp).toBe(true);
  });
  it("reconciles KPI, chart buckets, services and severity for each range", () => {
    for (const hours of [1, 6, 24]) {
      const summary = summarize(events, hours);
      expect(summary.buckets.reduce((sum, b) => sum + b.events, 0)).toBe(
        summary.total,
      );
      expect(summary.buckets.reduce((sum, b) => sum + b.errors, 0)).toBe(
        summary.errors,
      );
      expect(summary.services.reduce((sum, s) => sum + s.total, 0)).toBe(
        summary.total,
      );
      expect(summary.severity.reduce((sum, s) => sum + s.value, 0)).toBe(
        summary.total,
      );
      expect(summary.errorRate).toBe((summary.errors / summary.total) * 100);
    }
    expect(summarize(events, 24).previousTotal).toBe(2500);
  });
  it("combines search, severity, service and time predicates", () => {
    const params = new URLSearchParams({
      q: "TIMEOUT",
      service: "payments",
      severity: "error",
      from: events[2500].timestamp,
    });
    const result = filterEvents(events, params);
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (e) =>
          e.service === "payments" &&
          e.severity === "error" &&
          e.timestamp >= events[2500].timestamp,
      ),
    ).toBe(true);
    expect(
      eventPage(events, new URLSearchParams("q=does-not-exist")).total,
    ).toBe(0);
  });
  it("bounds pages at 500 and sorts 100k without exposing the whole dataset", () => {
    const result = eventPage(
      generateEvents(100000),
      new URLSearchParams("size=999999&sort=duration&order=desc"),
    );
    expect(result.items).toHaveLength(500);
    expect(result.total).toBe(100000);
    expect(
      result.items.every(
        (e, i) => i === 0 || result.items[i - 1].duration >= e.duration,
      ),
    ).toBe(true);
  });
  it("returns honest empty summaries", () => {
    const result = summarize([], 24);
    expect(result.total).toBe(0);
    expect(result.errorRate).toBe(0);
    expect(result.services.every((s) => s.health === "no data")).toBe(true);
  });
  it("opens, deduplicates and resolves incidents based on event windows", () => {
    const rule: Rule = {
      id: "test",
      name: "Failures",
      severity: "error",
      service: "all",
      threshold: 1,
      windowMinutes: 1440,
      enabled: true,
    };
    const history = evaluateRules(
      [rule],
      events,
      [],
      Date.parse(DEFAULT_ANCHOR),
    );
    expect(history).toHaveLength(1);
    expect(
      evaluateRules([rule], events, history, Date.parse(DEFAULT_ANCHOR)),
    ).toHaveLength(0);
    evaluateRules([rule], [], history, Date.parse(DEFAULT_ANCHOR));
    expect(history[0].state).toBe("resolved");
    expect(
      evaluateRules(
        [{ ...rule, enabled: false }],
        events,
        [],
        Date.parse(DEFAULT_ANCHOR),
      ),
    ).toHaveLength(0);
  });
  it("gives a reopened incident a new identity even when the simulation clock is frozen", () => {
    const rule: Rule = {
      id: "frozen-clock",
      name: "Failure threshold",
      severity: "error",
      service: "all",
      threshold: 1,
      windowMinutes: 1440,
      enabled: true,
    };
    const now = Date.parse(DEFAULT_ANCHOR);
    const history = evaluateRules([rule], events, [], now);
    history[0].state = "resolved";
    const reopened = evaluateRules([rule], events, history, now);
    expect(reopened).toHaveLength(1);
    expect(reopened[0].timestamp).toBe(history[0].timestamp);
    expect(reopened[0].id).not.toBe(history[0].id);
    expect(reopened[0].state).toBe("open");
  });
});
