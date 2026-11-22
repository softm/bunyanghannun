import { readFile, readdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(root, "public");
const errors = [];

async function walk(path) {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (["node_modules", "dist", ".cache", ".git"].includes(entry.name)) continue;
    const current = resolve(path, entry.name);
    files.push(...(entry.isDirectory() ? await walk(current) : [current]));
  }
  return files;
}

const files = await walk(root);
for (const file of files.filter((path) => /\.(mjs|js)$/.test(path))) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) errors.push(`${relative(root, file)}: ${result.stderr.trim()}`);
  const code = await readFile(file, "utf8");
  for (const match of code.matchAll(/(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g)) {
    try { await readFile(resolve(dirname(file), match[1])); }
    catch { errors.push(`Missing module: ${relative(root, file)} → ${match[1]}`); }
  }
}

const htmlFiles = files.filter((file) => file.startsWith(`${publicRoot}/`) && file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) errors.push(`Duplicate HTML ids: ${relative(root, file)}`);
  for (const match of html.matchAll(/(?:href|src)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
    if (match[1] === "./") continue;
    try { await readFile(resolve(dirname(file), match[1])); }
    catch { errors.push(`Missing asset: ${relative(root, file)} → ${match[1]}`); }
  }
}

for (const file of files.filter((path) => path.endsWith(".json") || path.endsWith(".webmanifest"))) {
  try { JSON.parse(await readFile(file, "utf8")); }
  catch (error) { errors.push(`Invalid JSON: ${relative(root, file)} (${error.message})`); }
}

const envelope = JSON.parse(await readFile(resolve(publicRoot, "data/notices.json"), "utf8"));
if (envelope.schemaVersion !== 1 || !Array.isArray(envelope.notices) || !Array.isArray(envelope.sources)) errors.push("Invalid public/data/notices.json envelope");
for (const notice of envelope.notices) {
  if (!notice.id || !notice.title || !notice.source || !notice.sourceName) errors.push(`Invalid notice identity: ${notice.id || "unknown"}`);
  if (notice.officialUrl && !/^https:\/\//.test(notice.officialUrl)) errors.push(`Non-HTTPS official URL: ${notice.id}`);
}

const manifest = JSON.parse(await readFile(resolve(publicRoot, "manifest.webmanifest"), "utf8"));
for (const size of ["192x192", "512x512"]) {
  if (!manifest.icons.some((icon) => icon.sizes === size && icon.type === "image/png")) errors.push(`Manifest missing ${size} PNG icon`);
}
if (!manifest.icons.some((icon) => String(icon.purpose).includes("maskable"))) errors.push("Manifest missing maskable icon");

const index = await readFile(resolve(publicRoot, "index.html"), "utf8");
if (!index.includes('id="bootSplash"') || !index.includes("beforeinstallprompt") && !(await readFile(resolve(publicRoot, "js/app.js"), "utf8")).includes("beforeinstallprompt")) errors.push("PWA splash or install entry missing");
const worker = await readFile(resolve(publicRoot, "sw.js"), "utf8");
if (!worker.includes("BUILD_ASSETS") || !worker.includes("url.pathname.includes('/data/')")) errors.push("Service worker must inject build assets and exclude live data");

for (const file of files.filter((path) => path.startsWith(`${publicRoot}/`) && /\.(js|json|html|md|webmanifest)$/.test(path))) {
  const content = await readFile(file, "utf8");
  if (/(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(content)) errors.push(`Credential-like value in ${relative(root, file)}`);
  if (/[?&](?:servicekey|api_?key)=[^&\s"'<>]+/i.test(content)) errors.push(`Private API key in public URL: ${relative(root, file)}`);
}

errors.forEach((error) => console.error(error));
console.log(`Checked ${files.length} files, ${htmlFiles.length} pages, PWA manifest, service worker and official-data boundaries.`);
if (errors.length) process.exitCode = 1;

