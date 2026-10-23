import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { eventSchema, type PulseEvent } from "../../../shared/contracts";
const messageSchema = z.object({
  type: z.literal("events"),
  events: z.array(eventSchema).max(100),
});
export const BUFFER_LIMIT = 300;
export function boundedEvents(previous: PulseEvent[], incoming: PulseEvent[]) {
  return [...incoming].reverse().concat(previous).slice(0, BUFFER_LIMIT);
}
export function reconnectDelay(attempt: number) {
  return Math.min(1000 * 2 ** Math.min(attempt, 5), 30000);
}
export function useStream() {
  const [events, setEvents] = useState<PulseEvent[]>([]),
    [state, setState] = useState("connecting"),
    [paused, setPaused] = useState(false),
    [received, setReceived] = useState(0),
    [reconnects, setReconnects] = useState(0),
    [session, setSession] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => {
    let socket: WebSocket,
      reconnect: ReturnType<typeof setTimeout> | undefined,
      disposed = false,
      attempt = 0,
      pending: PulseEvent[] = [];
    const flush = setInterval(() => {
      if (pending.length && !pausedRef.current) {
        const batch = pending;
        pending = [];
        setEvents((previous) => boundedEvents(previous, batch));
      }
    }, 500);
    const connect = () => {
      if (disposed) return;
      setState(attempt ? "reconnecting" : "connecting");
      socket = new WebSocket(
        `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`,
      );
      socket.onopen = () => {
        setState("connected");
      };
      socket.onmessage = (message) => {
        try {
          const parsed = messageSchema.parse(JSON.parse(String(message.data)));
          attempt = 0;
          setReceived((value) => value + parsed.events.length);
          if (!pausedRef.current)
            pending = pending.concat(parsed.events).slice(-BUFFER_LIMIT);
        } catch {
          setState("invalid data");
          socket.close();
        }
      };
      socket.onerror = () => setState("disconnected");
      socket.onclose = () => {
        if (disposed) return;
        if (attempt >= 8) {
          setState("disconnected");
          return;
        }
        const delay = reconnectDelay(attempt++);
        setState(`reconnecting in ${delay / 1000}s`);
        setReconnects((value) => value + 1);
        reconnect = setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      disposed = true;
      clearInterval(flush);
      clearTimeout(reconnect);
      socket?.close();
      pending = [];
    };
  }, [session]);
  return {
    events,
    state,
    paused,
    received,
    reconnects,
    togglePause: () => {
      pausedRef.current = !pausedRef.current;
      setPaused(pausedRef.current);
    },
    clear: () => setEvents([]),
    reconnect: () => setSession((value) => value + 1),
  };
}
