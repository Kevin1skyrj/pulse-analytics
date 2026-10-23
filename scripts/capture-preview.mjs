import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

// Run against a disposable local demo instance started with npm run dev.
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  await mkdir("docs/screenshots", { recursive: true });
  const base = "http://127.0.0.1:5173";
  await page.request.patch(`${base}/api/simulation`, {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await page.request.post(`${base}/api/dataset`, { data: { size: 5000 } });
  for (const [name, path, ready] of [
    ["overview-dark", "/", "Active users"],
    ["explorer-dark", "/events", "Event explorer"],
    ["analytics-dark", "/analytics", "Analytics"],
    ["alerts-dark", "/alerts", "Alerts & incidents"],
    ["settings-dark", "/settings", "Workspace settings"],
  ]) {
    await page.goto(base + path);
    await page.getByRole("heading", { name: ready, exact: true }).waitFor();
    await page
      .getByText("Loading workspace data…", { exact: true })
      .waitFor({ state: "hidden" });
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
    if (name === "analytics-dark") {
      const snapshot = await (
        await page.request.get(`${base}/api/summary?hours=24`)
      ).json();
      await page.getByRole("link", { name: /^Investigate events/ }).click();
      const investigation = new URL(page.url());
      assert.equal(investigation.searchParams.get("to"), snapshot.end);
      assert.equal(
        investigation.searchParams.get("from"),
        new Date(Date.parse(snapshot.start) + 1).toISOString(),
      );
      await page
        .getByRole("status")
        .filter({
          hasText: `${snapshot.total.toLocaleString()} matching events`,
        })
        .waitFor();
    }
  }
  await page
    .getByRole("combobox", { name: "Appearance" })
    .selectOption("light");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Active users", exact: true })
    .waitFor();
  await page.screenshot({
    path: "docs/screenshots/overview-light.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({
    path: "docs/screenshots/overview-tablet.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({
    path: "docs/screenshots/overview-mobile.png",
    fullPage: true,
  });
  await page.request.patch(`${base}/api/simulation`, {
    data: { latency: 120, failEvery: 0, streaming: true },
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${base}/live`);
  await page.locator(".live-feed .event-item").first().waitFor();
  await page.screenshot({
    path: "docs/screenshots/live-light.png",
    fullPage: true,
  });
  console.log("Saved nine actual browser screenshots in docs/screenshots.");
} finally {
  await browser.close();
}
