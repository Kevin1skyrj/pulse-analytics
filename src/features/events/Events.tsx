import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { services, severities, pageSchema } from "../../../shared/contracts";
import { useApi } from "../../services/api";
import { usePreferences } from "../../state/preferences";
import { PageTitle, QueryState, Badge } from "../../components/ui";
import EventDetail from "./EventDetail";

export default function Events() {
  const [params, setParams] = useSearchParams(),
    preferences = usePreferences();
  const requestParams = new URLSearchParams(params);
  requestParams.delete("event");
  const query = useApi(`/events?${requestParams}`, pageSchema),
    data = query.data;
  const [selected, setSelected] = useState<string[]>([]),
    [columns, setColumns] = useState({
      service: true,
      duration: true,
      time: true,
    }),
    [message, setMessage] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  // React Compiler is not enabled; keep the virtualizer local and do not memoize its methods.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: data?.items.length || 0,
    getScrollElement: () => scroll.current,
    estimateSize: () => (preferences.compact ? 40 : 48),
    overscan: 6,
    useFlushSync: false,
  });
  const rows = virtualizer.getVirtualItems(),
    items = data?.items || [];
  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page" && key !== "event") next.delete("page");
    setParams(next);
    if (key !== "event") scroll.current?.scrollTo({ top: 0 });
  }
  const toggle = (id: string) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  const toLocal = (value: string | null) => (value ? value.slice(0, 16) : "");
  return (
    <>
      <PageTitle
        title="Event explorer"
        description="Follow a signal from its first occurrence to the full context."
        actions={<Badge>Server-filtered · UTC</Badge>}
      />
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          set("q", String(form.get("search") || ""));
        }}
      >
        <div className="field">
          <label htmlFor="explorer-search">Search events</label>
          <div className="flex gap-2">
            <input
              id="explorer-search"
              key={params.get("q") || ""}
              name="search"
              defaultValue={params.get("q") || ""}
              placeholder="Message, event ID, service…"
            />
            <button className="button" aria-label="Search events">
              <Search size={16} />
            </button>
          </div>
        </div>
        <label className="field">
          Severity
          <select
            value={params.get("severity") || ""}
            onChange={(e) => set("severity", e.target.value)}
          >
            <option value="">All severities</option>
            {severities.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Service
          <select
            value={params.get("service") || ""}
            onChange={(e) => set("service", e.target.value)}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Status
          <select
            value={params.get("status") || ""}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="">All statuses</option>
            {["processed", "failed", "pending"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </form>
      <div className="filters-secondary">
        <label className="field">
          From (UTC)
          <input
            type="datetime-local"
            value={toLocal(params.get("from"))}
            onChange={(e) =>
              set(
                "from",
                e.target.value
                  ? new Date(`${e.target.value}Z`).toISOString()
                  : "",
              )
            }
          />
        </label>
        <label className="field">
          To (UTC)
          <input
            type="datetime-local"
            value={toLocal(params.get("to"))}
            onChange={(e) =>
              set(
                "to",
                e.target.value
                  ? new Date(`${e.target.value}Z`).toISOString()
                  : "",
              )
            }
          />
        </label>
        <label className="field">
          Sort by
          <select
            value={params.get("sort") || "timestamp"}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="timestamp">Timestamp</option>
            <option value="duration">Duration</option>
            <option value="severity">Severity</option>
          </select>
        </label>
        <label className="field">
          Then by
          <select
            value={params.get("then") || "timestamp"}
            onChange={(e) => set("then", e.target.value)}
          >
            <option value="timestamp">Timestamp</option>
            <option value="duration">Duration</option>
            <option value="severity">Severity</option>
          </select>
        </label>
        <label className="field">
          Order
          <select
            value={params.get("order") || "desc"}
            onChange={(e) => set("order", e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
        <button
          className="button"
          onClick={() => {
            setParams({});
            setSelected([]);
          }}
        >
          Clear filters
        </button>
      </div>
      <div className="panel">
        <div className="toolbar">
          <p role="status">
            {data
              ? `${data.total.toLocaleString()} matching events`
              : "Fetching events…"}{" "}
            <span className="muted">· {selected.length} selected</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <details>
              <summary className="cursor-pointer py-2">Columns</summary>
              <div className="flex flex-wrap gap-3">
                {(["service", "duration", "time"] as const).map((column) => (
                  <label className="check-label" key={column}>
                    <input
                      type="checkbox"
                      checked={columns[column]}
                      onChange={() =>
                        setColumns({ ...columns, [column]: !columns[column] })
                      }
                    />
                    {column}
                  </label>
                ))}
              </div>
            </details>
            <button
              className="button"
              disabled={!selected.length}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(selected.join("\n"));
                  setMessage(`${selected.length} event IDs copied`);
                } catch {
                  setMessage("Clipboard unavailable in this browser");
                }
              }}
            >
              <Copy size={14} />
              Copy selected IDs
            </button>
          </div>
        </div>
        <QueryState
          pending={query.isPending}
          error={query.error}
          retry={() => void query.refetch()}
          empty={!!data && !items.length}
        />
        {!!items.length && (
          <div
            className="event-scroll"
            ref={scroll}
            tabIndex={0}
            aria-label="Event results, scroll to explore"
          >
            <table className="event-table" aria-rowcount={items.length + 1}>
              <caption className="sr-only">
                Filtered events, page {data?.page}. Rows are virtualized. Use
                pagination for additional results.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      aria-label="Select current page"
                      checked={items.every((e) => selected.includes(e.id))}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [
                                ...new Set([
                                  ...selected,
                                  ...items.map((event) => event.id),
                                ]),
                              ]
                            : selected.filter(
                                (id) => !items.some((event) => event.id === id),
                              ),
                        )
                      }
                    />
                  </th>
                  <th className="message-cell" scope="col">
                    Event
                  </th>
                  <th scope="col">Severity</th>
                  {columns.service && <th scope="col">Service</th>}
                  {columns.duration && <th scope="col">Duration</th>}
                  {columns.time && <th scope="col">Time (UTC)</th>}
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={6}
                      style={{ height: rows[0].start, padding: 0, border: 0 }}
                    />
                  </tr>
                )}
                {rows.map((row) => {
                  const event = items[row.index];
                  return (
                    <tr key={event.id} aria-rowindex={row.index + 2}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${event.id}`}
                          checked={selected.includes(event.id)}
                          onChange={() => toggle(event.id)}
                        />
                      </td>
                      <td>
                        <button
                          className="text-button"
                          title={event.message}
                          onClick={() => set("event", event.id)}
                        >
                          {event.message}
                        </button>
                      </td>
                      <td>
                        <Badge tone={event.severity}>{event.severity}</Badge>
                      </td>
                      {columns.service && <td>{event.service}</td>}
                      {columns.duration && (
                        <td className="mono">{event.duration} ms</td>
                      )}
                      {columns.time && (
                        <td className="mono">
                          {event.timestamp.slice(11, 23)}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {rows.length > 0 && (
                  <tr aria-hidden="true">
                    <td
                      colSpan={6}
                      style={{
                        height:
                          virtualizer.getTotalSize() -
                          rows[rows.length - 1].end,
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <div className="pagination">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                value={params.get("size") || "100"}
                onChange={(e) => set("size", e.target.value)}
                style={{ width: 85 }}
              >
                <option>100</option>
                <option>500</option>
              </select>
            </label>
            <div className="flex items-center gap-3">
              <button
                className="button"
                aria-label="Previous page"
                disabled={data.page <= 1}
                onClick={() => set("page", String(data.page - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page {data.page} of {data.pages}
              </span>
              <button
                className="button"
                aria-label="Next page"
                disabled={data.page >= data.pages}
                onClick={() => set("page", String(data.page + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <p role="status" className="mt-3 text-xs muted">
        {message}
      </p>
      {params.get("event") && (
        <EventDetail
          id={params.get("event")!}
          onClose={() => set("event", "")}
        />
      )}
    </>
  );
}
