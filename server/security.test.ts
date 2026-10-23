import { afterEach, expect, it } from "vitest";
import { WebSocket } from "ws";
import { get } from "node:http";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createPulseServer, type ServerOptions } from "./app.js";
import { runtimeConfig } from "./config.js";
const cleanup: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const close of cleanup.splice(0)) await close();
});
async function start(options: ServerOptions = {}) {
  const app = createPulseServer(5000, options);
  await new Promise<void>((resolve) =>
    app.server.listen(0, "127.0.0.1", resolve),
  );
  cleanup.push(() => app.close());
  return {
    app,
    base: `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`,
  };
}
it("refuses unsafe binding and incomplete public configuration", () => {
  expect(() => runtimeConfig({ HOST: "0.0.0.0" })).toThrow(/loopback/);
  expect(() => runtimeConfig({ PULSE_MODE: "public" })).toThrow(/PULSE_ORIGIN/);
  expect(() =>
    runtimeConfig({
      PULSE_MODE: "public",
      PULSE_ORIGIN: "http://pulse.example",
    }),
  ).toThrow(/HTTPS/);
  expect(
    runtimeConfig({
      PULSE_MODE: "public",
      PULSE_ORIGIN: "https://pulse.example",
      PORT: "3002",
    }),
  ).toMatchObject({ publicDemo: true, host: "0.0.0.0", port: 3002 });
});
it("blocks every public mutation even without a browser Origin header", async () => {
  const { base } = await start({
    publicDemo: true,
    origin: "https://pulse.example",
  });
  for (const [path, method] of [
    ["rules", "POST"],
    ["rules/rule-payments", "PUT"],
    ["incidents/anything", "PATCH"],
    ["dataset", "POST"],
    ["simulation", "PATCH"],
  ]) {
    expect(
      (await fetch(`${base}/api/${path}`, { method, body: "{}" })).status,
    ).toBe(403);
  }
  expect(await (await fetch(`${base}/api/capabilities`)).json()).toEqual({
    mode: "public",
    mutations: false,
  });
  expect(
    (
      await fetch(`${base}/api/events`, {
        headers: { Origin: "https://untrusted.example" },
      })
    ).status,
  ).toBe(403);
});
it("serves built SPA routes and immutable assets without exposing source files", async () => {
  const root = await mkdtemp(join(tmpdir(), "pulse-static-"));
  cleanup.push(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "assets"));
  await writeFile(join(root, "index.html"), "<h1>Pulse</h1>");
  await writeFile(join(root, "assets", "entry-123.js"), "export {}");
  await writeFile(join(root, ".env"), "private");
  const { base } = await start({
    publicDemo: true,
    origin: "https://pulse.example",
    staticDir: root,
  });
  const page = await fetch(`${base}/events?severity=error`);
  expect(await page.text()).toContain("Pulse");
  expect(page.headers.get("content-security-policy")).toContain(
    "frame-ancestors 'none'",
  );
  const asset = await fetch(`${base}/assets/entry-123.js`);
  expect(asset.headers.get("cache-control")).toContain("immutable");
  for (const path of [
    "/.env",
    "/server/app.ts",
    "/assets/missing.js",
    "/assets/%2e%2e%2f.env",
  ])
    expect((await fetch(base + path)).status).toBe(404);
  expect((await fetch(`${base}/events`, { method: "HEAD" })).status).toBe(200);
});
it("bounds public request budgets while health remains reachable", async () => {
  const { base } = await start({
    publicDemo: true,
    origin: "https://pulse.example",
    apiBudget: 2,
  });
  await fetch(`${base}/api/capabilities`);
  await fetch(`${base}/api/capabilities`);
  const limited = await fetch(`${base}/api/events`);
  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBe("60");
  expect((await fetch(`${base}/api/health`)).status).toBe(200);
});
it("rejects foreign websocket upgrades and enforces a connection cap", async () => {
  const { base } = await start({
    publicDemo: true,
    origin: "https://pulse.example",
    maxClients: 1,
  });
  const connect = (origin: string) =>
    new WebSocket(base.replace("http:", "ws:") + "/ws", { origin });
  const rejected = connect("https://untrusted.example");
  await expect(
    new Promise((resolve, reject) => {
      rejected.once("open", resolve);
      rejected.once("error", reject);
    }),
  ).rejects.toThrow(/403/);
  const accepted = connect("https://pulse.example");
  cleanup.push(() => accepted.terminate());
  await new Promise((resolve) => accepted.once("open", resolve));
  const excess = connect("https://pulse.example");
  await expect(
    new Promise((resolve, reject) => {
      excess.once("open", resolve);
      excess.once("error", reject);
    }),
  ).rejects.toThrow(/403/);
});
it("rejects oversized bodies, wrong methods and local DNS-rebinding hosts", async () => {
  const { base } = await start();
  expect(
    (
      await fetch(`${base}/api/simulation`, {
        method: "PATCH",
        body: "x".repeat(21000),
      })
    ).status,
  ).toBe(413);
  expect((await fetch(`${base}/api/events`, { method: "POST" })).status).toBe(
    405,
  );
  const status = await new Promise<number | undefined>((resolve, reject) => {
    get(
      `${base}/api/health`,
      { headers: { Host: "untrusted.example" } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    ).on("error", reject);
  });
  expect(status).toBe(403);
});
it("contains malformed request URLs and remains healthy afterwards", async () => {
  const { base } = await start();
  const status = await new Promise<number | undefined>((resolve, reject) => {
    get(base, { path: "//[" }, (response) => {
      response.resume();
      resolve(response.statusCode);
    }).on("error", reject);
  });
  expect(status).toBe(400);
  expect((await fetch(`${base}/api/health`)).status).toBe(200);
});
