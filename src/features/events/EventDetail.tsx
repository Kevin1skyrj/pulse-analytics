import { useState } from "react";
import { Copy } from "lucide-react";
import { eventSchema } from "../../../shared/contracts";
import { useApi } from "../../services/api";
import { Dialog, QueryState, Badge } from "../../components/ui";
export default function EventDetail({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const query = useApi(`/events/${encodeURIComponent(id)}`, eventSchema),
    event = query.data;
  const [message, setMessage] = useState("");
  return (
    <Dialog drawer title="Event details" onClose={onClose}>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {event && (
        <>
          <div className="mb-6 flex items-center justify-between gap-2">
            <Badge tone={event.severity}>{event.severity}</Badge>
            <button
              className="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(event.id);
                  setMessage("Event ID copied");
                } catch {
                  setMessage(
                    "Clipboard unavailable. Select the ID below to copy it.",
                  );
                }
              }}
            >
              <Copy size={14} />
              Copy ID
            </button>
          </div>
          <h3 className="mb-5 text-lg">{event.message}</h3>
          <dl className="details">
            {Object.entries({
              ID: event.id,
              Timestamp: event.timestamp,
              Service: event.service,
              Status: event.status,
              User: event.userId,
              Duration: `${event.duration} ms`,
            }).map(([key, value]) => (
              <div className="contents" key={key}>
                <dt>{key}</dt>
                <dd className="mono">{value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mb-3 text-sm">Event metadata</h3>
          <pre className="json" tabIndex={0} aria-label="Event metadata JSON">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
          <p role="status" className="mt-4 text-xs muted">
            {message}
          </p>
        </>
      )}
    </Dialog>
  );
}
