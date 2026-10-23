import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Settings2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Columns2,
} from "lucide-react";
import { summarySchema } from "../../../shared/contracts";
import { useApi } from "../../services/api";
import { PageTitle, Panel, Badge, QueryState } from "../../components/ui";
import {
  usePreferences,
  updatePreferences,
  widgetIds,
} from "../../state/preferences";
import { VolumeChart, Distribution } from "../analytics/Charts";

export default function Overview() {
  const [params, setParams] = useSearchParams(),
    hours = ["1", "6", "24"].includes(params.get("hours") || "")
      ? params.get("hours")!
      : "24";
  const query = useApi(`/summary?hours=${hours}`, summarySchema, true),
    data = query.data;
  const preferences = usePreferences(),
    [customize, setCustomize] = useState(false),
    [message, setMessage] = useState("");
  function move(id: (typeof widgetIds)[number], to: number) {
    const layout = [...preferences.layout],
      from = layout.indexOf(id);
    layout.splice(from, 1);
    layout.splice(Math.max(0, Math.min(layout.length, to)), 0, id);
    updatePreferences({ layout });
    setMessage(`${id} moved to position ${layout.indexOf(id) + 1}`);
  }
  const titles = {
    metrics: "Key indicators",
    volume: "Event volume",
    severity: "Severity distribution",
    services: "Service health",
    activity: "Recent activity",
  };
  return (
    <>
      <PageTitle
        title="Workspace overview"
        description="Your operational pulse. Every signal, in context."
        actions={
          <>
            <Badge tone="info">Simulated data</Badge>
            <label className="sr-only" htmlFor="overview-range">
              Overview time range
            </label>
            <select
              id="overview-range"
              value={hours}
              onChange={(e) => setParams({ hours: e.target.value })}
              style={{ width: 130 }}
            >
              <option value="1">Last hour</option>
              <option value="6">Last 6 hours</option>
              <option value="24">Last 24 hours</option>
            </select>
            <button className="button" onClick={() => setCustomize(true)}>
              <Settings2 size={15} />
              Customize
            </button>
          </>
        }
      />
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {data && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs muted">
            <span className="status-dot" />
            Snapshot ending {data.end.slice(11, 19)} UTC <span>•</span>{" "}
            {data.total.toLocaleString()} events in this window
          </div>
          <div className="widget-grid">
            {preferences.layout
              .filter((id) => !preferences.hidden.includes(id))
              .map((id) => (
                <div
                  key={id}
                  className={`widget ${id === "metrics" ? "widget-metrics" : preferences.wide.includes(id) ? "widget-wide" : ""}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const source = widgetIds.find(
                      (widget) =>
                        widget === e.dataTransfer.getData("text/plain"),
                    );
                    if (source) move(source, preferences.layout.indexOf(id));
                  }}
                >
                  {customize && (
                    <div className="widget-toolbar">
                      <span>{titles[id]}</span>
                      <button
                        className="icon-button"
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", id)
                        }
                        aria-label={`Drag ${titles[id]}`}
                      >
                        <GripVertical size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${titles[id]} up`}
                        disabled={preferences.layout.indexOf(id) === 0}
                        onClick={() =>
                          move(id, preferences.layout.indexOf(id) - 1)
                        }
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${titles[id]} down`}
                        disabled={preferences.layout.indexOf(id) === 4}
                        onClick={() =>
                          move(id, preferences.layout.indexOf(id) + 1)
                        }
                      >
                        <ArrowDown size={15} />
                      </button>
                      {id !== "metrics" && (
                        <button
                          className="icon-button"
                          aria-label={`Toggle ${titles[id]} width`}
                          onClick={() =>
                            updatePreferences({
                              wide: preferences.wide.includes(id)
                                ? preferences.wide.filter((w) => w !== id)
                                : [...preferences.wide, id],
                            })
                          }
                        >
                          <Columns2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                  {id === "metrics" && (
                    <section aria-label="Key indicators" className="metrics">
                      {[
                        [
                          "Active users",
                          data.users.toLocaleString(),
                          "Unique user IDs in this window",
                        ],
                        [
                          "Total events",
                          data.total.toLocaleString(),
                          `${data.previousTotal.toLocaleString()} in previous equal window`,
                        ],
                        [
                          "Error rate",
                          `${data.errorRate.toFixed(2)}%`,
                          `${(data.errorRate - data.previousErrorRate).toFixed(2)} percentage points vs. previous`,
                        ],
                        [
                          "System health",
                          !data.total
                            ? "No data"
                            : data.services.some((s) => s.health === "degraded")
                              ? "Degraded"
                              : "Healthy",
                          `${data.services.filter((s) => s.health === "healthy").length} of ${data.services.length} services healthy`,
                        ],
                      ].map(([label, value, note]) => (
                        <article className="panel metric" key={label}>
                          <h2 className="metric-label">{label}</h2>
                          <p className="metric-value">{value}</p>
                          <p className="metric-note">{note}</p>
                        </article>
                      ))}
                    </section>
                  )}
                  {id === "volume" && (
                    <Panel
                      title="Event volume"
                      actions={
                        <span className="text-xs muted">
                          {data.throughput.toFixed(1)} events / min
                        </span>
                      }
                    >
                      <VolumeChart data={data} />
                    </Panel>
                  )}
                  {id === "severity" && (
                    <Panel title="Severity distribution">
                      <Distribution data={data} />
                    </Panel>
                  )}
                  {id === "services" && (
                    <Panel title="Service health">
                      {data.services.map((service) => (
                        <div className="service-row" key={service.name}>
                          <Link to={`/events?service=${service.name}`}>
                            {service.name}
                          </Link>
                          <span className="mono">
                            {service.total.toLocaleString()}
                          </span>
                          <Badge tone={service.health}>{service.health}</Badge>
                        </div>
                      ))}
                      <p className="chart-summary pt-4">
                        Degraded when error rate exceeds 10% in this window.
                      </p>
                    </Panel>
                  )}
                  {id === "activity" && (
                    <Panel
                      title="Recent activity"
                      actions={
                        <Link className="text-button text-xs" to="/events">
                          Explore events →
                        </Link>
                      }
                    >
                      {data.recent.map((event) => (
                        <div key={event.id} className="event-item">
                          <Link to={`/events?event=${event.id}`}>
                            {event.message}
                            <p>
                              {event.service} · {event.timestamp.slice(11, 19)}{" "}
                              UTC
                            </p>
                          </Link>
                          <Badge tone={event.severity}>{event.severity}</Badge>
                        </div>
                      ))}
                      <QueryState empty={!data.recent.length} />
                    </Panel>
                  )}
                </div>
              ))}
          </div>
        </>
      )}
      <p role="status" className="sr-only">
        {message}
      </p>
      {customize && (
        <div className="panel panel-body mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Drag a widget handle or use its arrow buttons. Width controls use
              the same grid.
            </p>
            <button
              className="button primary"
              onClick={() => setCustomize(false)}
            >
              Done customizing
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-5">
            {widgetIds.map((id) => (
              <label key={id} className="check-label">
                <input
                  type="checkbox"
                  checked={!preferences.hidden.includes(id)}
                  onChange={() =>
                    updatePreferences({
                      hidden: preferences.hidden.includes(id)
                        ? preferences.hidden.filter((w) => w !== id)
                        : [...preferences.hidden, id],
                    })
                  }
                />
                {titles[id]}
              </label>
            ))}
            <button
              className="button"
              onClick={() => {
                updatePreferences({
                  layout: [...widgetIds],
                  hidden: [],
                  wide: ["volume", "activity"],
                });
                setMessage("Default layout restored");
              }}
            >
              Restore default layout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
