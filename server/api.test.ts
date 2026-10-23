import { afterAll, beforeAll, expect, it } from "vitest";
import { WebSocket } from "ws";
import { createPulseServer } from "./app.js";
import type { AddressInfo } from "node:net";
const app = createPulseServer(),
  sockets: WebSocket[] = [];
let base = "";
beforeAll(async () => {
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
afterAll(() => {
  sockets.forEach((socket) => socket.terminate());
  app.close();
});
it("validates alert input and persists an edited rule in memory", async () => {
  const invalid = await fetch(`${base}/api/rules`, {
    method: "POST",
    body: JSON.stringify({ name: "x" }),
  });
  expect(invalid.status).toBe(400);
  const input = {
    name: "Integration rule",
    service: "all",
    severity: "critical",
    threshold: 1,
    windowMinutes: 60,
    enabled: true,
  };
  const rule = await (
    await fetch(`${base}/api/rules`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  ).json();
  const edited = await (
    await fetch(`${base}/api/rules/${rule.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, enabled: false }),
    })
  ).json();
  expect(edited.enabled).toBe(false);
});
it("delivers genuine websocket batches", async () => {
  const socket = new WebSocket(base.replace("http:", "ws:") + "/ws");
  sockets.push(socket);
  const data = await new Promise<string>((resolve, reject) => {
    socket.once("message", (message) => resolve(message.toString()));
    socket.once("error", reject);
  });
  expect(JSON.parse(data).events).toHaveLength(3);
  socket.close();
});
it("supports failure injection and an unaffected reset endpoint", async () => {
  await fetch(`${base}/api/simulation`, {
    method: "PATCH",
    body: JSON.stringify({ latency: 0, failEvery: 1, streaming: false }),
  });
  expect((await fetch(`${base}/api/events`)).status).toBe(503);
  expect((await fetch(`${base}/api/simulation`)).status).toBe(200);
  await fetch(`${base}/api/simulation`, {
    method: "PATCH",
    body: JSON.stringify({ latency: 0, failEvery: 0, streaming: false }),
  });
  const result = await (await fetch(`${base}/api/events?size=100`)).json();
  expect(result.items).toHaveLength(100);
});
it("prevents a stale acknowledgement from reopening a resolved incident", async () => {
  const rule = await (
    await fetch(`${base}/api/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: "Transition regression",
        service: "all",
        severity: "error",
        threshold: 1,
        windowMinutes: 1440,
        enabled: true,
      }),
    })
  ).json();
  const history = await (await fetch(`${base}/api/incidents`)).json();
  const incident = history.find(
    (item: { ruleId: string }) => item.ruleId === rule.id,
  );
  expect(incident).toBeDefined();
  expect(
    (
      await fetch(`${base}/api/incidents/${incident.id}`, {
        method: "PATCH",
        body: '{"state":"resolved"}',
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await fetch(`${base}/api/incidents/${incident.id}`, {
        method: "PATCH",
        body: '{"state":"acknowledged"}',
      })
    ).status,
  ).toBe(409);
});
