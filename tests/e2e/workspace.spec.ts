import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ request }) => {
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await request.post("/api/dataset", { data: { size: 5000 } });
});
test("routes, explorer URL filters, virtual rows and detail focus", async ({
  page,
}) => {
  await page.goto("/events?severity=error&service=payments&size=500");
  await expect(
    page.getByRole("heading", { name: "Event explorer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Severity", exact: true }),
  ).toHaveValue("error");
  await expect(
    page.getByRole("button", { name: "Request exceeded timeout" }).first(),
  ).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeLessThan(35);
  const trigger = page
    .getByRole("button", { name: "Request exceeded timeout" })
    .first();
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Event details" }),
  ).toBeVisible();
  await expect(page.getByLabel("Event metadata JSON")).toContainText("traceId");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Service", exact: true }),
  ).toHaveValue("payments");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("textbox", { name: "Search events" })
    .fill("nonexistent-signal");
  await page
    .getByRole("button", { name: "Search events", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No matching activity" }),
  ).toBeVisible();
});
test("theme, customization persistence, command palette and mobile navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Severity distribution", exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Move Recent activity up" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("heading", { name: "Severity distribution", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Jump to anything" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Analytics", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Analytics", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Workspace settings" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
test("creates, edits and toggles a real alert rule", async ({ page }) => {
  const originalName = `Browser failures ${Date.now()}`;
  const editedName = `Edited ${originalName}`;
  await page.goto("/alerts");
  await page.getByRole("button", { name: "Create rule" }).click();
  await page.getByLabel("Rule name").fill(originalName);
  await page.getByLabel("Event threshold").fill("1");
  await page.getByLabel("Window (minutes)").fill("1440");
  await page.getByRole("button", { name: "Save rule" }).click();
  await expect(
    page.getByRole("heading", { name: originalName, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: `Edit ${originalName}` }).click();
  await page.getByLabel("Rule name").fill(editedName);
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("checkbox", { name: `Enable ${editedName}` }).uncheck();
  await expect(
    page.getByRole("checkbox", { name: `Enable ${editedName}` }),
  ).not.toBeChecked();
  // The immediate checkbox update is optimistic; reload only after persistence.
  await expect(
    page.getByRole("checkbox", { name: `Enable ${editedName}` }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: `Enable ${editedName}` }),
  ).not.toBeChecked();
});
test("live stream pauses and recovers after a real websocket disconnect", async ({
  page,
  request,
}) => {
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: true },
  });
  await page.goto("/live");
  await expect(page.getByText("connected", { exact: true })).toBeVisible();
  await expect(page.locator(".live-feed .event-item").first()).toBeVisible();
  await page.getByRole("button", { name: "Pause feed" }).click();
  await expect(page.getByText("Feed paused.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Resume feed" }).click();
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await expect(page.getByText(/reconnecting in/)).toBeVisible();
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: true },
  });
  await expect(page.getByText("connected", { exact: true })).toBeVisible({
    timeout: 15000,
  });
});
test("API errors can be recovered and 100k rows stay bounded", async ({
  page,
  request,
}) => {
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 1, streaming: false },
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Unable to load data" }),
  ).toBeVisible({ timeout: 10000 });
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Active users" }),
  ).toBeVisible();
  await request.post("/api/dataset", { data: { size: 100000 } });
  await page.goto("/events?size=500");
  await expect(page.getByRole("status").first()).toContainText(
    "100,000 matching events",
  );
  await expect(page.locator("tbody tr[aria-rowindex]").first()).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeLessThan(35);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 200")).toBeVisible();
});

test("all routes fit mobile, tablet and desktop, with accessible dark and light themes", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/content.security.policy|unsafe-eval/i.test(message.text()))
      errors.push(message.text());
  });
  for (const theme of ["dark", "light"]) {
    await page.goto("/settings");
    await page
      .getByRole("combobox", { name: "Appearance" })
      .selectOption(theme);
    await page.getByRole("button", { name: "Save preferences" }).click();
    for (const route of [
      "/",
      "/events",
      "/analytics",
      "/live",
      "/alerts",
      "/settings",
    ]) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      // Wait for data-bearing pages before scanning, rather than scanning a loading skeleton.
      if (route === "/")
        await expect(
          page.getByRole("heading", { name: "Active users" }),
        ).toBeVisible();
      if (route === "/events")
        await expect(
          page.locator("tbody tr[aria-rowindex]").first(),
        ).toBeVisible();
      await expect(
        page.getByText("Loading workspace data…", { exact: true }),
      ).toHaveCount(0);
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ).toEqual([]);
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        ).toBe(true);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  expect(errors).toEqual([]);
});

test("settings persist, empty data is honest, and incident actions work", async ({
  page,
  request,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/settings");
  await page
    .getByRole("textbox", { name: "Workspace name" })
    .fill("Pulse QA workspace");
  await page.getByRole("checkbox", { name: "Compact event rows" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Workspace name" }),
  ).toHaveValue("Pulse QA workspace");
  await expect(
    page.getByRole("checkbox", { name: "Compact event rows" }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Load empty dataset" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Loaded 0" }),
  ).toBeVisible();
  await page.goto("/events");
  await expect(
    page.getByRole("heading", { name: "No matching activity" }),
  ).toBeVisible();
  await request.post("/api/dataset", { data: { size: 5000 } });
  const incidentName = `Incident action test ${Date.now()}`;
  await request.post("/api/rules", {
    data: {
      name: incidentName,
      service: "all",
      severity: "error",
      threshold: 1,
      windowMinutes: 1440,
      enabled: true,
    },
  });
  await page.goto("/alerts");
  await page
    .getByRole("button", { name: new RegExp(`^${incidentName}`) })
    .click();
  await page.getByRole("button", { name: "Acknowledge", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("acknowledged", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Resolve incident", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("resolved", { exact: true }),
  ).toBeVisible();
  const history: { id: string }[] = await (
    await request.get("/api/incidents")
  ).json();
  expect(new Set(history.map((incident) => incident.id)).size).toBe(
    history.length,
  );
  expect(consoleErrors).toEqual([]);
});

test("sorting, columns and selection use real data; Chromium verifies clipboard", async ({
  page,
  context,
  browserName,
}) => {
  if (browserName === "chromium")
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/events?size=500");
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("severity");
  await page
    .getByRole("combobox", { name: "Then by", exact: true })
    .selectOption("duration");
  await expect(page).toHaveURL(/then=duration/);
  await expect(page.locator("tbody tr[aria-rowindex]").first()).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Select current page", exact: true })
    .check();
  if (browserName === "chromium") {
    await page.getByRole("button", { name: "Copy selected IDs" }).click();
    await expect(page.getByRole("status").last()).toHaveText(
      "500 event IDs copied",
    );
    expect(
      (await page.evaluate(() => navigator.clipboard.readText())).split("\n"),
    ).toHaveLength(500);
  }
  await page.getByText("Columns", { exact: true }).click();
  await page.getByRole("checkbox", { name: "duration", exact: true }).uncheck();
  await expect(
    page.getByRole("columnheader", { name: "Duration", exact: true }),
  ).toHaveCount(0);
});

test("dashboard dragging, keyboard resizing and reset persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Active users" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("button", { name: "Drag Event volume", exact: true })
    .dragTo(
      page.getByRole("button", {
        name: "Drag Severity distribution",
        exact: true,
      }),
    );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pulse.preferences.v1")!).layout.indexOf(
        "volume",
      ),
    ),
  ).toBe(2);
  await page.getByRole("button", { name: "Toggle Event volume width" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pulse.preferences.v1")!).wide.includes(
        "volume",
      ),
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Restore default layout" }).click();
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("pulse.preferences.v1")!).layout,
    ),
  ).toEqual(["metrics", "volume", "severity", "services", "activity"]);
});
