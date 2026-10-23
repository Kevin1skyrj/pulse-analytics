import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { z } from "zod";
import {
  ruleInput,
  ruleSchema,
  incidentSchema,
  services,
  severities,
  type Rule,
  type Incident,
} from "../../../shared/contracts";
import { useApi, useCapabilities } from "../../services/api";
import {
  saveRule,
  toggleRule,
  transitionIncident,
} from "../../services/mutations";
import {
  PageTitle,
  Panel,
  Badge,
  Dialog,
  QueryState,
} from "../../components/ui";

function RuleEditor({
  rule,
  onClose,
}: {
  rule: Rule | null;
  onClose: () => void;
}) {
  const client = useQueryClient(),
    [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (value: z.infer<typeof ruleInput>) => saveRule(rule, value),
    onSuccess: () => {
      void client.invalidateQueries();
      onClose();
    },
  });
  return (
    <Dialog
      title={rule ? "Edit alert rule" : "Create alert rule"}
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const result = ruleInput.safeParse({
            name: form.get("name"),
            service: form.get("service"),
            severity: form.get("severity"),
            threshold: Number(form.get("threshold")),
            windowMinutes: Number(form.get("window")),
            enabled: form.has("enabled"),
          });
          if (!result.success) {
            setError(result.error.issues.map((i) => i.message).join(". "));
            return;
          }
          setError("");
          mutation.mutate(result.data);
        }}
      >
        <label className="field">
          Rule name
          <input
            name="name"
            autoFocus
            required
            minLength={3}
            maxLength={80}
            defaultValue={rule?.name || ""}
            placeholder="e.g. Checkout errors rising"
          />
        </label>
        <label className="field">
          Service
          <select name="service" defaultValue={rule?.service || "all"}>
            <option value="all">All services</option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Minimum severity
          <select name="severity" defaultValue={rule?.severity || "error"}>
            {severities.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="field">
            Event threshold
            <input
              name="threshold"
              type="number"
              min={1}
              max={10000}
              required
              defaultValue={rule?.threshold || 5}
            />
          </label>
          <label className="field">
            Window (minutes)
            <input
              name="window"
              type="number"
              min={1}
              max={1440}
              required
              defaultValue={rule?.windowMinutes || 60}
            />
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={rule?.enabled ?? true}
          />
          Enable rule
        </label>
        <p className="muted text-xs">
          Creates an incident when matching event count reaches the threshold.
          Evaluated against the simulation clock. No external notifications are
          sent.
        </p>
        {(error || mutation.error) && (
          <p role="alert" className="error-message">
            {error || mutation.error?.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save rule"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export default function Alerts() {
  const canMutate = useCapabilities().data?.mutations === true;
  const rules = useApi("/rules", z.array(ruleSchema)),
    history = useApi("/incidents", z.array(incidentSchema), true),
    client = useQueryClient();
  const [editing, setEditing] = useState<Rule | null | undefined>(),
    [selectedIncident, setIncident] = useState<Incident | null>(null);
  const incident =
    history.data?.find((item) => item.id === selectedIncident?.id) ||
    selectedIncident;
  const [pendingToggle, setPendingToggle] = useState<{
    id: string;
    enabled: boolean;
  } | null>(null);
  const toggle = useMutation({
    mutationFn: toggleRule,
    onSettled: async () => {
      await client.invalidateQueries();
      setPendingToggle(null);
    },
  });
  const transition = useMutation({
    mutationFn: transitionIncident,
    onSuccess: async (data) => {
      setIncident(data);
      await client.invalidateQueries();
    },
  });
  return (
    <>
      <PageTitle
        title="Alerts & incidents"
        description="Turn operational signals into clear, actionable thresholds."
        actions={
          <button
            className="button primary"
            disabled={!canMutate}
            onClick={() => setEditing(null)}
          >
            <Plus size={16} />
            Create rule
          </button>
        }
      />
      <QueryState
        pending={rules.isPending}
        error={rules.error || history.error}
        retry={() => {
          void rules.refetch();
          void history.refetch();
        }}
      />
      {(toggle.error || transition.error) && (
        <p role="alert" className="error-message mb-4">
          {toggle.error?.message || transition.error?.message}
        </p>
      )}
      <Panel
        title="Alert rules"
        actions={
          <span className="muted text-xs">
            {rules.data?.filter((r) => r.enabled).length || 0} enabled
          </span>
        }
      >
        {rules.data?.map((rule) => (
          <div className="rule-row" key={rule.id}>
            <div>
              <h3>{rule.name}</h3>
              <p>
                {rule.service} · {rule.severity}+ · ≥ {rule.threshold} events /{" "}
                {rule.windowMinutes} min
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="check-label">
                <input
                  type="checkbox"
                  aria-label={`Enable ${rule.name}`}
                  checked={
                    pendingToggle?.id === rule.id
                      ? pendingToggle.enabled
                      : rule.enabled
                  }
                  disabled={!canMutate || pendingToggle !== null}
                  onChange={() => {
                    setPendingToggle({ id: rule.id, enabled: !rule.enabled });
                    toggle.mutate(rule);
                  }}
                />
                {rule.enabled ? "Enabled" : "Disabled"}
              </label>
              <button
                className="icon-button"
                aria-label={`Edit ${rule.name}`}
                disabled={!canMutate}
                onClick={() => setEditing(rule)}
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>
        ))}
        <QueryState
          empty={!!rules.data && !rules.data.length}
          emptyTitle="No alert rules yet"
          emptyDescription="Create a rule to monitor event counts by service and severity."
        />
      </Panel>
      <div className="mt-6">
        <Panel
          title="Incident history"
          actions={
            <Badge>
              {history.data?.filter((i) => i.state === "open").length || 0} open
            </Badge>
          }
        >
          {history.data?.map((item) => (
            <div className="event-item" key={item.id}>
              <button className="text-button" onClick={() => setIncident(item)}>
                {item.name}
                <p>
                  {item.timestamp.replace("T", " ").slice(0, 19)} UTC ·{" "}
                  {item.count} matching events
                </p>
              </button>
              <Badge tone={item.state}>{item.state}</Badge>
            </div>
          ))}
          <QueryState
            pending={history.isPending}
            empty={!!history.data && !history.data.length}
            emptyTitle="No incidents recorded"
            emptyDescription="Enabled rules create incidents when their event count reaches the configured threshold."
          />
        </Panel>
      </div>
      {editing !== undefined && (
        <RuleEditor rule={editing} onClose={() => setEditing(undefined)} />
      )}
      {incident && (
        <Dialog title="Incident detail" onClose={() => setIncident(null)}>
          <Badge tone={incident.state}>{incident.state}</Badge>
          <h3 className="mt-5 text-lg">{incident.name}</h3>
          <p className="my-4 muted">
            {incident.count} matching events triggered this incident at{" "}
            {incident.timestamp}. Rules resolve automatically when the count
            falls below threshold.
          </p>
          <p className="mono mb-5">{incident.id}</p>
          <div className="flex gap-3">
            <button
              className="button"
              disabled={
                !canMutate || incident.state !== "open" || transition.isPending
              }
              onClick={() =>
                transition.mutate({ id: incident.id, state: "acknowledged" })
              }
            >
              Acknowledge
            </button>
            <button
              className="button primary"
              disabled={
                !canMutate ||
                incident.state === "resolved" ||
                transition.isPending
              }
              onClick={() =>
                transition.mutate({ id: incident.id, state: "resolved" })
              }
            >
              Resolve incident
            </button>
          </div>
          <p className="mt-4 text-xs muted">
            A resolved incident can recur if the rule remains breached.
          </p>
          {transition.error && (
            <p role="alert" className="error-message mt-4">
              {transition.error.message}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
