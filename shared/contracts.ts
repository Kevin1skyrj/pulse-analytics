import { z } from "zod";

export const services = [
  "api-gateway",
  "identity",
  "payments",
  "event-worker",
  "web-client",
  "storage",
] as const;
export const severities = ["info", "warning", "error", "critical"] as const;
export const eventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  service: z.enum(services),
  severity: z.enum(severities),
  status: z.enum(["processed", "failed", "pending"]),
  message: z.string(),
  userId: z.string(),
  duration: z.number().nonnegative(),
  metadata: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
});
export type PulseEvent = z.infer<typeof eventSchema>;
export const ruleInput = z.object({
  name: z.string().trim().min(3).max(80),
  service: z.enum(["all", ...services]),
  severity: z.enum(severities),
  threshold: z.number().int().min(1).max(10000),
  windowMinutes: z.number().int().min(1).max(1440),
  enabled: z.boolean(),
});
export const ruleSchema = ruleInput.extend({ id: z.string() });
export type Rule = z.infer<typeof ruleSchema>;
export const incidentSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  name: z.string(),
  timestamp: z.string(),
  count: z.number(),
  state: z.enum(["open", "acknowledged", "resolved"]),
});
export type Incident = z.infer<typeof incidentSchema>;
export const summarySchema = z.object({
  total: z.number(),
  users: z.number(),
  errors: z.number(),
  errorRate: z.number(),
  throughput: z.number(),
  previousTotal: z.number(),
  previousErrorRate: z.number(),
  start: z.string(),
  end: z.string(),
  buckets: z.array(
    z.object({ time: z.string(), events: z.number(), errors: z.number() }),
  ),
  services: z.array(
    z.object({
      name: z.string(),
      total: z.number(),
      errors: z.number(),
      health: z.enum(["healthy", "degraded", "no data"]),
    }),
  ),
  severity: z.array(z.object({ name: z.string(), value: z.number() })),
  recent: z.array(eventSchema),
});
export type Summary = z.infer<typeof summarySchema>;
export const pageSchema = z.object({
  items: z.array(eventSchema),
  total: z.number(),
  page: z.number(),
  pages: z.number(),
});
export const simulationSchema = z.object({
  latency: z.number().int().min(0).max(3000),
  failEvery: z.number().int().min(0).max(100),
  streaming: z.boolean(),
});
export const infoSchema = simulationSchema.extend({
  seed: z.number(),
  size: z.number(),
  anchor: z.string(),
});
export type Simulation = z.infer<typeof simulationSchema>;
