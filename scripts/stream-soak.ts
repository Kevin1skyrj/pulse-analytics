import { createPulseServer } from "../server/app.js";
import { WebSocket } from "ws";
import { boundedEvents } from "../src/features/live/stream-buffer.js";
import type { PulseEvent } from "../shared/contracts.js";
import type { AddressInfo } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const seconds = Number(process.env.PULSE_SOAK_SECONDS || 180);
assert(Number.isFinite(seconds) && seconds >= 10 && seconds <= 3600);
const app = createPulseServer(100000);
let socket: WebSocket | undefined,
  received = 0,
  displayed: PulseEvent[] = [];
const samples: {
  elapsedSeconds: number;
  heapMiB: number;
  retained: number;
  serverEvents: number;
  clients: number;
}[] = [];
try {
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  const url = `ws://127.0.0.1:${(app.server.address() as AddressInfo).port}/ws`;
  const connect = async () => {
    socket = new WebSocket(url);
    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString()) as {
        type: string;
        events: PulseEvent[];
      };
      if (message.type === "events") {
        received += message.events.length;
        displayed = boundedEvents(displayed, message.events);
      }
    });
    await new Promise<void>((resolve, reject) => {
      socket!.once("open", resolve);
      socket!.once("error", reject);
    });
  };
  await connect();
  const start = Date.now();
  for (let elapsed = 0; elapsed <= seconds; elapsed += Math.min(30, seconds)) {
    global.gc?.();
    const state = app.diagnostics();
    samples.push({
      elapsedSeconds: Math.round((Date.now() - start) / 1000),
      heapMiB: +(process.memoryUsage().heapUsed / 1048576).toFixed(2),
      retained: displayed.length,
      serverEvents: state.events,
      clients: state.clients,
    });
    assert(
      state.events <= 100000 && displayed.length <= 300 && state.clients === 1,
    );
    if (elapsed >= seconds) break;
    await delay(Math.min(30, seconds - elapsed) * 1000);
    if (elapsed > 0 && elapsed % 60 === 0) {
      socket!.terminate();
      await delay(50);
      await connect();
    }
  }
  socket!.terminate();
  await delay(50);
  assert.equal(app.diagnostics().clients, 0);
  assert(received > 0);
  const report = {
    node: process.version,
    platform: process.platform,
    durationSeconds: seconds,
    received,
    retained: displayed.length,
    clientsAfterClose: app.diagnostics().clients,
    explicitGC: !!global.gc,
    samples,
  };
  await mkdir("docs/release-audit", { recursive: true });
  await writeFile(
    "docs/release-audit/stream-soak.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  socket?.terminate();
  app.close();
}
