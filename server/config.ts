import { resolve } from "node:path";
export function runtimeConfig(env: NodeJS.ProcessEnv = process.env) {
  const mode = env.PULSE_MODE || "local";
  if (mode !== "local" && mode !== "public")
    throw new Error("PULSE_MODE must be local or public");
  const publicDemo = mode === "public";
  const host = env.HOST || (publicDemo ? "0.0.0.0" : "127.0.0.1");
  if (!publicDemo && !["127.0.0.1", "localhost", "::1"].includes(host))
    throw new Error(
      "Mutable local mode must bind to loopback; use PULSE_MODE=public for hosting",
    );
  const port = Number(env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be 1–65535");
  const size = Number(env.PULSE_SIZE || 5000);
  if (![0, 5000, 100000].includes(size))
    throw new Error("PULSE_SIZE must be 0, 5000 or 100000");
  let origin: string | undefined;
  if (publicDemo) {
    if (!env.PULSE_ORIGIN)
      throw new Error("Public mode requires PULSE_ORIGIN=https://your-domain");
    const url = new URL(env.PULSE_ORIGIN);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      throw new Error(
        "PULSE_ORIGIN must be an HTTPS origin (HTTP loopback is allowed for local smoke tests)",
      );
    origin = url.origin;
  }
  return {
    host,
    port,
    size,
    publicDemo,
    origin,
    staticDir: env.PULSE_SERVE_STATIC === "1" ? resolve("dist") : undefined,
  };
}
