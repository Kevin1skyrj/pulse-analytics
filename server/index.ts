import { createPulseServer } from "./app.js";
import { runtimeConfig } from "./config.js";
import { accessSync } from "node:fs";
import { join } from "node:path";
const config = runtimeConfig({
  ...process.env,
  ...(process.argv.includes("--serve") ? { PULSE_SERVE_STATIC: "1" } : {}),
});
if (config.staticDir) accessSync(join(config.staticDir, "index.html"));
const app = createPulseServer(config.size, config);
app.server.on("error", (error) => {
  console.error(`Pulse could not start: ${error.message}`);
  app.close();
  process.exitCode = 1;
});
app.server.listen(config.port, config.host, () =>
  console.log(
    `Pulse ${config.publicDemo ? "public read-only demo" : "local simulation"}: http://${config.host}:${config.port}`,
  ),
);
process.on("SIGINT", () => app.close());
process.on("SIGTERM", () => app.close());
