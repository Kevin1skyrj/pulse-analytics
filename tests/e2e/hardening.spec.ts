import { test, expect } from "@playwright/test";
test.beforeEach(async ({ request }) => {
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await request.post("/api/dataset", { data: { size: 5000 } });
});
test("keyboard dialogs contain focus, Escape restores it, reduced motion is respected", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await request.patch("/api/simulation", {
    data: { latency: 2000, failEvery: 0, streaming: false },
  });
  await page.goto("/events");
  await expect(page.locator(".loading-icon")).toHaveCSS(
    "animation-name",
    "none",
  );
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  const trigger = page.getByRole("button", { name: "Open command palette" });
  await trigger.focus();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const outline = await trigger.evaluate(
    (element) => getComputedStyle(element).outlineStyle,
  );
  expect(outline).not.toBe("none");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Analytics", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Analytics", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
});
test("analytics investigation preserves the exact snapshot and service", async ({
  page,
  request,
}) => {
  await page.goto("/analytics?hours=6&service=payments");
  const snapshot = await (
    await request.get("/api/summary?hours=6&service=payments")
  ).json();
  await expect(
    page.getByRole("heading", { name: "Current events" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Investigate events/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Service", exact: true }),
  ).toHaveValue("payments");
  await expect(page.getByRole("status").first()).toContainText(
    `${snapshot.total.toLocaleString()} matching events`,
  );
  expect(new URL(page.url()).searchParams.get("to")).toBe(snapshot.end);
});
test("live dataset reset clears old events without duplicate identifiers", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("same key"))
      errors.push(message.text());
  });
  await request.patch("/api/simulation", {
    data: { latency: 0, failEvery: 0, streaming: true },
  });
  await page.goto("/live");
  await expect(page.locator(".live-feed .event-item").first()).toBeVisible();
  const oldID = await page
    .locator(".live-feed .event-item p")
    .first()
    .innerText();
  await request.post("/api/dataset", { data: { size: 5000 } });
  await expect(page.locator(".live-feed")).not.toContainText(oldID);
  await expect(page.locator(".live-feed .event-item").first()).toBeVisible();
  expect(errors).toEqual([]);
});
