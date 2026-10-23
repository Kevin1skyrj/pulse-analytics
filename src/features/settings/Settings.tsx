import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { infoSchema } from "../../../shared/contracts";
import { useApi } from "../../services/api";
import { updateSimulation, loadDataset } from "../../services/mutations";
import { usePreferences, updatePreferences } from "../../state/preferences";
import { PageTitle, Panel, QueryState } from "../../components/ui";
export default function Settings() {
  const preferences = usePreferences(),
    info = useApi("/simulation", infoSchema),
    client = useQueryClient(),
    [message, setMessage] = useState("");
  const simulation = useMutation({
    mutationFn: updateSimulation,
    onSuccess: () => {
      void client.invalidateQueries();
      setMessage("Simulation settings applied");
    },
  });
  const dataset = useMutation({
    mutationFn: loadDataset,
    onSuccess: (data) => {
      void client.resetQueries();
      setMessage(
        `Loaded ${data.size.toLocaleString()} deterministic events; incident history reset`,
      );
    },
  });
  return (
    <>
      <PageTitle
        title="Workspace settings"
        description="Make Pulse yours. Explore realistic conditions safely in a local simulation."
      />
      <div className="settings-grid">
        <Panel title="Workspace preferences">
          <form
            className="panel-body form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const form = new FormData(e.currentTarget);
                updatePreferences({
                  workspace: String(form.get("workspace")).trim(),
                  theme: form.get("theme") === "light" ? "light" : "dark",
                  compact: form.has("compact"),
                });
                setMessage("Preferences saved on this browser");
              } catch {
                setMessage(
                  "Could not save preferences. Check the name and browser storage permissions.",
                );
              }
            }}
          >
            <label className="field">
              Workspace name
              <input
                key={preferences.workspace}
                name="workspace"
                minLength={1}
                maxLength={40}
                required
                defaultValue={preferences.workspace}
              />
            </label>
            <label className="field">
              Appearance
              <select
                key={preferences.theme}
                name="theme"
                defaultValue={preferences.theme}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label className="check-label">
              <input
                key={String(preferences.compact)}
                type="checkbox"
                name="compact"
                defaultChecked={preferences.compact}
              />
              Compact event rows
            </label>
            <p className="muted text-xs">
              Timestamps use UTC consistently across the workspace. Preferences
              and dashboard layout are stored locally in your browser.
            </p>
            <button className="button primary justify-self-start">
              Save preferences
            </button>
          </form>
        </Panel>
        <Panel title="Simulation controls">
          <QueryState
            pending={info.isPending}
            error={info.error}
            retry={() => void info.refetch()}
          />
          {info.data && (
            <form
              key={JSON.stringify(info.data)}
              className="panel-body form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                simulation.mutate({
                  latency: Number(form.get("latency")),
                  failEvery: Number(form.get("failEvery")),
                  streaming: form.has("streaming"),
                });
              }}
            >
              <label className="field">
                API latency (0–3000 ms)
                <input
                  name="latency"
                  type="number"
                  min={0}
                  max={3000}
                  required
                  defaultValue={info.data.latency}
                />
              </label>
              <label className="field">
                Fail every N API requests (0 = off)
                <input
                  name="failEvery"
                  type="number"
                  min={0}
                  max={100}
                  required
                  defaultValue={info.data.failEvery}
                />
              </label>
              <label className="check-label">
                <input
                  name="streaming"
                  type="checkbox"
                  defaultChecked={info.data.streaming}
                />
                Enable WebSocket stream
              </label>
              <p className="muted text-xs">
                Disabling the stream closes current connections. Re-enable it to
                exercise reconnection recovery. Settings remain reachable during
                simulated API failures.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="button primary"
                  disabled={simulation.isPending}
                >
                  Apply simulation
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() =>
                    simulation.mutate({
                      latency: 120,
                      failEvery: 0,
                      streaming: true,
                    })
                  }
                >
                  Reset conditions
                </button>
              </div>
            </form>
          )}
        </Panel>
        <Panel title="Dataset laboratory">
          <div className="panel-body form-grid">
            <p className="muted text-sm">
              Seed 20261024 · fixed starting clock 24 Oct 2026, 12:00 UTC ·
              48-hour history. Loading a dataset resets the simulation clock and
              incident history. Rules stay in memory until server restart.
            </p>
            <p>
              Retained events:{" "}
              <strong>{info.data?.size.toLocaleString() || "—"}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {[5000, 100000, 0].map((size) => (
                <button
                  className="button"
                  key={size}
                  disabled={dataset.isPending}
                  onClick={() => dataset.mutate(size)}
                >
                  {size
                    ? `Load ${size.toLocaleString()}`
                    : "Load empty dataset"}
                </button>
              ))}
            </div>
            <p className="text-xs muted">
              Pause the stream before loading an empty dataset to keep it empty.
            </p>
          </div>
        </Panel>
        <Panel title="Keyboard & workflow">
          <dl className="panel-body details">
            <dt>Ctrl / ⌘ + K</dt>
            <dd>Open command palette</dd>
            <dt>Tab / Shift+Tab</dt>
            <dd>Move through controls</dd>
            <dt>Escape</dt>
            <dd>Close dialogs and drawers</dd>
            <dt>Dashboard</dt>
            <dd>Customize → arrow buttons reorder widgets without dragging</dd>
            <dt>Event explorer</dt>
            <dd>Copy the browser URL to share filters and the open event</dd>
          </dl>
        </Panel>
      </div>
      <p role="status" className="success-message mt-5">
        {message}
      </p>
      {(simulation.error || dataset.error) && (
        <p role="alert" className="error-message mt-4">
          {simulation.error?.message || dataset.error?.message}
        </p>
      )}
    </>
  );
}
