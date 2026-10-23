import { Link, useSearchParams } from "react-router";
import { services, summarySchema } from "../../../shared/contracts";
import { useApi } from "../../services/api";
import { PageTitle, Panel, QueryState, Badge } from "../../components/ui";
import { VolumeChart, Distribution } from "./Charts";
export default function Analytics() {
  const [params, setParams] = useSearchParams(),
    hours = ["1", "6", "24"].includes(params.get("hours") || "")
      ? params.get("hours")!
      : "24",
    service = params.get("service") || "";
  const query = useApi(
      `/summary?hours=${hours}&service=${encodeURIComponent(service)}`,
      summarySchema,
      true,
    ),
    data = query.data;
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  };
  return (
    <>
      <PageTitle
        title="Analytics"
        description="Understand throughput, reliability, and the services behind every event."
        actions={<Badge>Simulated · UTC</Badge>}
      />
      <div className="filters-secondary">
        <label className="field">
          Time window
          <select value={hours} onChange={(e) => set("hours", e.target.value)}>
            <option value="1">Last hour</option>
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
          </select>
        </label>
        <label className="field">
          Service
          <select
            value={service}
            onChange={(e) => set("service", e.target.value)}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <Link
          className="button"
          to={`/events?${new URLSearchParams({
            service,
            ...(data
              ? {
                  from: new Date(Date.parse(data.start) + 1).toISOString(),
                  to: data.end,
                }
              : {}),
          })}`}
        >
          Investigate events →
        </Link>
      </div>
      <QueryState
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      />
      {data && (
        <>
          <div className="metrics mb-5">
            {[
              ["Throughput", `${data.throughput.toFixed(1)} / min`],
              ["Current events", data.total.toLocaleString()],
              ["Previous window", data.previousTotal.toLocaleString()],
              [
                "Error rate change",
                `${(data.errorRate - data.previousErrorRate).toFixed(2)} pp`,
              ],
            ].map(([label, value]) => (
              <div className="panel metric" key={label}>
                <h2 className="metric-label">{label}</h2>
                <p className="metric-value">{value}</p>
              </div>
            ))}
          </div>
          <div className="widget-grid">
            <Panel title="Event throughput">
              <VolumeChart data={data} />
            </Panel>
            <Panel title="Error trend">
              <VolumeChart data={data} errors />
            </Panel>
            <Panel title="Severity distribution">
              <Distribution data={data} />
            </Panel>
            <Panel
              title="Service distribution"
              actions={
                <span className="muted text-xs">Click to cross-filter</span>
              }
            >
              {data.services.map((s) => (
                <div className="service-row" key={s.name}>
                  <button
                    className="text-button"
                    onClick={() => set("service", s.name)}
                  >
                    {s.name}
                  </button>
                  <span>{s.total.toLocaleString()}</span>
                  <Badge tone={s.health}>{s.errors} errors</Badge>
                </div>
              ))}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
