import type { PulseEvent } from "../../../shared/contracts.js";
export const BUFFER_LIMIT = 300;
export function boundedEvents(previous: PulseEvent[], incoming: PulseEvent[]) {
  return [...incoming].reverse().concat(previous).slice(0, BUFFER_LIMIT);
}
export function reconnectDelay(attempt: number) {
  return Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
}
