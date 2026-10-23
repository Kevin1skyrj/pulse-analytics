// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { generateEvents } from "../../../server/data";
import { useStream } from "./useStream";
class FakeSocket {
  static instances: FakeSocket[] = [];
  onmessage: ((message: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor() {
    FakeSocket.instances.push(this);
  }
  sendBatch() {
    this.onmessage?.({
      data: JSON.stringify({ type: "events", events: generateEvents(3) }),
    });
  }
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  FakeSocket.instances = [];
});
it("discards queued arrivals on clear, pause and dataset reset, then cleans up timers", () => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", FakeSocket);
  const { result, unmount } = renderHook(() => useStream());
  const socket = FakeSocket.instances[0];
  act(() => {
    socket.sendBatch();
    result.current.clear();
    vi.advanceTimersByTime(500);
  });
  expect(result.current.events).toHaveLength(0);
  act(() => {
    socket.sendBatch();
    result.current.togglePause();
    vi.advanceTimersByTime(500);
  });
  act(() => {
    result.current.togglePause();
    vi.advanceTimersByTime(500);
  });
  expect(result.current.events).toHaveLength(0);
  act(() => {
    socket.sendBatch();
    vi.advanceTimersByTime(500);
  });
  expect(result.current.events).toHaveLength(3);
  act(() => socket.onmessage?.({ data: '{"type":"reset"}' }));
  expect(result.current.events).toHaveLength(0);
  act(() => socket.onclose?.());
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(socket.close).toHaveBeenCalledOnce();
});
