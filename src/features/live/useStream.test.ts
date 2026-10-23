import { expect, it } from "vitest";
import { generateEvents } from "../../../server/data";
import { boundedEvents, reconnectDelay, BUFFER_LIMIT } from "./useStream";
it("bounds a stream buffer and keeps newest events first", () => {
  const data = generateEvents(1000),
    result = boundedEvents(data.slice(0, 300).reverse(), data.slice(300));
  expect(result).toHaveLength(BUFFER_LIMIT);
  expect(result[0].id).toBe(data.at(-1)?.id);
});
it("backs off to 30 seconds without unbounded growth", () => {
  expect([0, 1, 2, 3, 4, 5, 9].map(reconnectDelay)).toEqual([
    1000, 2000, 4000, 8000, 16000, 30000, 30000,
  ]);
});
