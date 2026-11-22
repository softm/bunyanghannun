import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/", import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!pathname || pathname.endsWith("/")) pathname += "index.html";
    const path = resolve(root, pathname);
    if (path !== resolve(root, "index.html") && !path.startsWith(`${resolve(root)}${sep}`)) throw new Error("Invalid path");
    const info = await stat(path);
    if (!info.isFile()) throw new Error("Not a file");
    const body = await readFile(path);
    const noCache = pathname.endsWith(".html") || pathname.startsWith("data/") || pathname === "sw.js";
    response.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": noCache ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("찾을 수 없습니다.");
  }
}).listen(port, "127.0.0.1", () => console.log(`청약한눈: http://127.0.0.1:${port}/?demo=1`));

