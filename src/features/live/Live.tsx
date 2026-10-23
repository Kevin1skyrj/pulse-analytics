import { useState } from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import { PageTitle, Panel, Badge, QueryState } from "../../components/ui";
import { useStream, BUFFER_LIMIT } from "./useStream";
import EventDetail from "../events/EventDetail";
export default function Live() {
  const stream = useStream(),
    [id, setId] = useState("");
  return (
    <>
      <PageTitle
        title="Live monitor"
        description="Follow the stream as it happens. Synthetic events delivered over WebSocket."
        actions={
          <>
            <button className="button" onClick={stream.togglePause}>
              {stream.paused ? <Play size={15} /> : <Pause size={15} />}
              {stream.paused ? "Resume feed" : "Pause feed"}
            </button>
            <button className="button" onClick={stream.reconnect}>
              <RefreshCw size={15} />
              Reconnect
            </button>
          </>
        }
      />
      <div className="live-stats">
        <span role="status">
          <Badge tone={stream.state === "connected" ? "connected" : "warning"}>
            {stream.state}
          </Badge>
        </span>
        <span>
          <strong>{stream.received.toLocaleString()}</strong> received this
          visit
        </span>
        <span>
          <strong>{stream.events.length}</strong> / {BUFFER_LIMIT} retained
        </span>
        <span>
          <strong>
            {
              stream.events.filter(
                (e) => e.severity === "error" || e.severity === "critical",
              ).length
            }
          </strong>{" "}
          retained errors
        </span>
        <span>{stream.reconnects} reconnect attempts</span>
      </div>
      {stream.paused && (
        <div role="status" className="panel panel-body mb-5">
          Feed paused. Incoming events are counted but not added to this view.
          Resume shows new arrivals; use Event explorer to investigate missed
          events.
        </div>
      )}
      <Panel
        title="Incoming events"
        actions={
          <button className="text-button text-xs" onClick={stream.clear}>
            Clear view
          </button>
        }
      >
        <div className="live-feed" tabIndex={0} aria-label="Live event feed">
          {stream.events.map((event) => (
            <div className="event-item" key={event.id}>
              <span className="mono muted">
                {event.timestamp.slice(11, 19)}
              </span>
              <button
                className="text-button grow"
                onClick={() => setId(event.id)}
              >
                {event.message}
                <p>
                  {event.service} · {event.id}
                </p>
              </button>
              <Badge tone={event.severity}>{event.severity}</Badge>
            </div>
          ))}
          <QueryState
            empty={!stream.events.length}
            emptyTitle="No events in this feed yet"
            emptyDescription="Incoming events appear while connected and resumed. Check simulation settings if the stream is disabled."
          />
        </div>
      </Panel>
      <p className="mt-4 text-xs muted">
        3 simulated events / second · updates batched every 500 ms ·
        reconnection backs off to 30 seconds, up to 8 attempts. Missing
        intervals remain searchable while retained by the server.
      </p>
      {id && <EventDetail id={id} onClose={() => setId("")} />}
    </>
  );
}
