import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ServerResponse } from "node:http";

export async function serveStatic(
  path: string,
  directory: string,
  res: ServerResponse,
  head: boolean,
) {
  // Only generated assets and the SPA entry are ever served. No arbitrary file paths.
  let file = "index.html";
  if (/^\/assets\/[\w.-]+\.(js|css)$/.test(path)) file = path.slice(1);
  else if (path === "/favicon.svg") file = "favicon.svg";
  else if (
    path.includes(".") ||
    path.startsWith("/assets/") ||
    path.includes("\\")
  )
    return false;
  try {
    const body = await readFile(join(directory, file));
    const type = file.endsWith(".js")
      ? "text/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : file.endsWith(".svg")
          ? "image/svg+xml"
          : "text/html";
    res.writeHead(200, {
      "Content-Type": `${type}; charset=utf-8`,
      "Content-Length": body.length,
      "Cache-Control": file.startsWith("assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    res.end(head ? undefined : body);
    return true;
  } catch {
    return false;
  }
}
