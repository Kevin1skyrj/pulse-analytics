import { useSyncExternalStore } from "react";
import { z } from "zod";

export const widgetIds = [
  "metrics",
  "volume",
  "severity",
  "services",
  "activity",
] as const;
const schema = z.object({
  theme: z.enum(["dark", "light"]).default("dark"),
  workspace: z.string().min(1).max(40).default("Acme engineering"),
  collapsed: z.boolean().default(false),
  compact: z.boolean().default(false),
  layout: z
    .array(z.enum(widgetIds))
    .length(5)
    .refine((v) => new Set(v).size === 5)
    .default([...widgetIds]),
  hidden: z.array(z.enum(widgetIds)).default([]),
  wide: z.array(z.enum(widgetIds)).default(["volume", "activity"]),
});
export type Preferences = z.infer<typeof schema>;
const key = "pulse.preferences.v1";
function read(): Preferences {
  try {
    return schema.parse(JSON.parse(localStorage.getItem(key) || "{}"));
  } catch {
    return schema.parse({});
  }
}
let current = read();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((listener) => listener());
}
window.addEventListener("storage", (event) => {
  if (event.key === key) {
    current = read();
    notify();
  }
});
export function updatePreferences(patch: Partial<Preferences>) {
  const next = schema.parse({ ...current, ...patch });
  localStorage.setItem(key, JSON.stringify(next));
  current = next;
  notify();
}
export function usePreferences() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => current,
  );
}
