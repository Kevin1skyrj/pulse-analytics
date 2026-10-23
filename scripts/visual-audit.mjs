import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const stage = process.argv[2] || "after";
if (!["before", "after"].includes(stage))
  throw new Error("Use before or after");
const folder = `docs/release-audit/${stage}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const results = [];
try {
  const page = await browser.newPage();
  const base = process.env.PULSE_AUDIT_URL || "http://127.0.0.1:5173";
  await page.request.patch(`${base}/api/simulation`, {
    data: { latency: 0, failEvery: 0, streaming: false },
  });
  await page.request.post(`${base}/api/dataset`, { data: { size: 5000 } });
  for (const theme of ["dark", "light"]) {
    await page.goto(`${base}/settings`);
    await page
      .getByRole("combobox", { name: "Appearance" })
      .selectOption(theme);
    await page.getByRole("button", { name: "Save preferences" }).click();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [name, path] of [
        ["overview", "/"],
        ["events", "/events"],
        ["live", "/live"],
        ["analytics", "/analytics"],
        ["alerts", "/alerts"],
        ["settings", "/settings"],
      ]) {
        await page.goto(base + path);
        await page.locator("main h1").waitFor();
        await expect(
          page.getByText("Loading workspace data…", { exact: true }),
        ).toHaveCount(0);
        if (name === "events")
          await page.locator("tbody tr[aria-rowindex]").first().waitFor();
        if (name === "overview")
          await page
            .getByRole("heading", { name: "Active users", exact: true })
            .waitFor();
        const overflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        const file = `${name}-${theme}-${width}.png`;
        await page.screenshot({ path: `${folder}/${file}`, fullPage: true });
        results.push({
          name,
          theme,
          width,
          file,
          overflow: overflow.page > overflow.viewport,
        });
      }
    }
  }
  await writeFile(`${folder}/results.json`, JSON.stringify(results, null, 2));
  await writeFile(
    `${folder}/index.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Pulse ${stage} visual audit</title><style>body{font:14px system-ui;background:#ddd;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}img{width:100%;height:auto}figure{margin:0;background:white;padding:10px}</style><h1>Pulse ${stage}: 36 views</h1><main>${results.map((r) => `<figure><figcaption>${r.name} · ${r.theme} · ${r.width}px</figcaption><a href="${r.file}"><img src="${r.file}" alt="${r.name} ${r.theme} at ${r.width} pixels"></a></figure>`).join("")}</main></html>`,
  );
  console.log(
    JSON.stringify({
      stage,
      views: results.length,
      overflows: results.filter((r) => r.overflow),
    }),
  );
} finally {
  await browser.close();
}
