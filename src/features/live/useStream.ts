import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { eventSchema, type PulseEvent } from "../../../shared/contracts";
import { boundedEvents, reconnectDelay, BUFFER_LIMIT } from "./stream-buffer";
export { boundedEvents, reconnectDelay, BUFFER_LIMIT } from "./stream-buffer";
const messageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("events"),
    events: z.array(eventSchema).max(100),
  }),
  z.object({ type: z.literal("reset") }),
]);
export function useStream() {
  const [events, setEvents] = useState<PulseEvent[]>([]),
    [state, setState] = useState("connecting"),
    [paused, setPaused] = useState(false),
    [received, setReceived] = useState(0),
    [reconnects, setReconnects] = useState(0),
    [session, setSession] = useState(0);
  const pausedRef = useRef(false);
  const pending = useRef<PulseEvent[]>([]);
  useEffect(() => {
    let socket: WebSocket,
      reconnect: ReturnType<typeof setTimeout> | undefined,
      disposed = false,
      attempt = 0;
    const flush = setInterval(() => {
      if (pending.current.length && !pausedRef.current) {
        const batch = pending.current;
        pending.current = [];
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
        if (disposed) return;
        setState("connected");
      };
      socket.onmessage = (message) => {
        if (disposed) return;
        try {
          const parsed = messageSchema.parse(JSON.parse(String(message.data)));
          if (parsed.type === "reset") {
            pending.current = [];
            setEvents([]);
            return;
          }
          attempt = 0;
          setReceived((value) => value + parsed.events.length);
          if (!pausedRef.current)
            pending.current = pending.current
              .concat(parsed.events)
              .slice(-BUFFER_LIMIT);
        } catch {
          setState("invalid data");
          socket.close();
        }
      };
      socket.onerror = () => {
        if (!disposed) setState("disconnected");
      };
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
      pending.current = [];
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
      if (pausedRef.current) pending.current = [];
      setPaused(pausedRef.current);
    },
    clear: () => {
      pending.current = [];
      setEvents([]);
    },
    reconnect: () => setSession((value) => value + 1),
  };
}
