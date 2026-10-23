import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import type { Summary } from "../../../shared/contracts";

export function VolumeChart({
  data,
  errors = false,
}: {
  data: Summary;
  errors?: boolean;
}) {
  const total = errors ? data.errors : data.total;
  return (
    <>
      <div
        className="chart"
        role="img"
        aria-label={`${errors ? "Error" : "Event"} volume: ${total.toLocaleString()} in 24 time buckets. Data table follows.`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data.buckets}
            margin={{ top: 8, right: 18, left: -20, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="var(--line)"
              vertical={false}
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="time"
              tickFormatter={(value) => String(value).slice(11, 16)}
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              minTickGap={36}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(value) => `${String(value).slice(11, 16)} UTC`}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey={errors ? "errors" : "events"}
              name={errors ? "Errors" : "Events"}
              stroke={errors ? "var(--red)" : "var(--accent)"}
              fill={errors ? "var(--red)" : "var(--accent)"}
              fillOpacity={0.09}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-summary">
        <p>
          {total.toLocaleString()} {errors ? "errors" : "events"} ·{" "}
          {data.start.slice(0, 16).replace("T", " ")} —{" "}
          {data.end.slice(0, 16).replace("T", " ")} UTC
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer">
            View accessible chart data
          </summary>
          <table className="mt-3 w-full text-left">
            <caption className="sr-only">Volume per time bucket</caption>
            <thead>
              <tr>
                <th scope="col">UTC time</th>
                <th scope="col">Events</th>
                <th scope="col">Errors</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets.map((bucket) => (
                <tr key={bucket.time}>
                  <td>{bucket.time.slice(11, 16)}</td>
                  <td>{bucket.events}</td>
                  <td>{bucket.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  );
}
export function Distribution({ data }: { data: Summary }) {
  return (
    <>
      <div
        className="chart"
        role="img"
        aria-label="Events grouped by severity. Exact counts listed below."
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data.severity}
            margin={{ left: -20, right: 15 }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--line)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "var(--raised)" }} />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              name="Events"
              fill="var(--accent)"
              radius={[3, 3, 0, 0]}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-summary">
        {data.severity
          .map((item) => `${item.name}: ${item.value.toLocaleString()}`)
          .join(" · ")}
      </p>
    </>
  );
}
