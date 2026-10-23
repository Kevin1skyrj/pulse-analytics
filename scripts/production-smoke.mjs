import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4174";
const child = spawn(
  process.execPath,
  ["dist-server/server/index.js", "--serve"],
  {
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "4174",
      PULSE_MODE: "public",
      PULSE_ORIGIN: base,
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
let log = "";
child.stdout.on("data", (chunk) => {
  log += chunk;
});
child.stderr.on("data", (chunk) => {
  log += chunk;
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error(log);
    try {
      ready = (await fetch(base + "/api/health")).ok;
    } catch {
      /* starting */
    }
    if (ready) break;
    await delay(250);
  }
  assert(ready, "Production server did not start");
  assert.equal(
    (await fetch(base + "/api/simulation", { method: "PATCH", body: "{}" }))
      .status,
    403,
  );
  for (const path of ["/.env", "/server/app.ts", "/assets/missing.js"])
    assert.equal((await fetch(base + path)).status, 404);
  browser = await chromium.launch(process.env.CI ? {} : { channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(base + "/alerts");
  await expect(page.getByRole("note")).toContainText("Public read-only demo");
  await expect(
    page.getByRole("button", { name: "Create rule" }),
  ).toBeDisabled();
  await page.goto(base + "/events?severity=error");
  await expect(page.locator("tbody tr[aria-rowindex]").first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Severity", exact: true }),
  ).toHaveValue("error");
  await page.goto(base + "/settings");
  await expect(
    page.getByRole("button", { name: "Apply simulation" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save preferences" }),
  ).toBeEnabled();
  await mkdir("docs/release-audit/after", { recursive: true });
  await page.screenshot({
    path: "docs/release-audit/after/public-settings.png",
    fullPage: true,
  });
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      scan.violations.map((item) => item.id),
      [],
    );
    if (width === 375)
      await page.screenshot({
        path: "docs/release-audit/after/public-settings-mobile.png",
        fullPage: true,
      });
  }
  await page.goto(base + "/live");
  await expect(page.locator(".live-feed .event-item").first()).toBeVisible();
  await page.goto(base + "/");
  await expect(
    page.getByRole("heading", { name: "Active users", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/release-audit/after/public-overview.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await writeFile(
    "docs/release-audit/production-smoke.json",
    JSON.stringify(
      {
        status: "passed",
        mode: "public",
        transport: "HTTP loopback; external TLS not exercised",
        checks: [
          "compiled server startup",
          "SPA deep links/reload",
          "read-only REST and UI",
          "static source protection",
          "CSP without browser errors",
          "real WebSocket feed",
          "browser-local preferences enabled",
          "public settings axe and overflow at 375/1440px",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Production smoke passed: SPA, read-only controls, static protection, CSP, and WebSocket stream.",
  );
} finally {
  await browser?.close();
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000),
  ]);
}
