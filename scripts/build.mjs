import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(root, "public");
const distRoot = resolve(root, "dist");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await cp(publicRoot, distRoot, { recursive: true });

const hash = createHash("sha256");
const immutablePaths = ["js", "adfit-config.js", "styles.css", "assets/fonts/SUIT-Variable.woff2"];
hash.update("bunyanghannun-v1\0");
for (const path of immutablePaths) await hashPath(resolve(distRoot, path), path);
const revision = hash.digest("hex").slice(0, 12);
const versionRoot = resolve(distRoot, "_app", revision);
await mkdir(versionRoot, { recursive: true });
for (const path of immutablePaths) {
  const destination = resolve(versionRoot, path);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(distRoot, path), destination, { recursive: true });
}

for (const name of (await readdir(distRoot)).filter((entry) => entry.endsWith(".html"))) {
  const path = resolve(distRoot, name);
  let html = await readFile(path, "utf8");
  html = html
    .replace(/(href|src)="\.\/(styles\.css|js\/[^"]+\.js)"/g, (_, attribute, asset) => `${attribute}="./_app/${revision}/${asset}"`)
    .replace("<html lang=\"ko\">", `<html lang="ko" data-build="${revision}">`);
  await writeFile(path, html);
}

const buildAssets = (await listFiles(versionRoot)).map((path) => `./_app/${revision}/${path}`).sort();
const workerPath = resolve(distRoot, "sw.js");
let worker = await readFile(workerPath, "utf8");
worker = worker
  .replace("const CACHE_NAME='bunyanghannun-shell-source';", `const CACHE_NAME='bunyanghannun-shell-${revision}';`)
  .replace("const BUILD_ASSETS=[];", `const BUILD_ASSETS=${JSON.stringify(buildAssets)};`);
await writeFile(workerPath, worker);
await writeFile(resolve(distRoot, ".nojekyll"), "");
console.log(`Built 청약한눈 in dist/; version ${revision}, ${buildAssets.length} immutable assets.`);

async function hashPath(path, prefix) {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    hash.update(`${prefix}\0`).update(await readFile(path));
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    await hashPath(resolve(path, entry.name), `${prefix}/${entry.name}`);
  }
}

async function listFiles(path, prefix = "") {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await listFiles(resolve(path, entry.name), `${relative}/`));
    else files.push(relative);
  }
  return files;
}

