import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("분양한눈 제품 경계와 운영 식별자가 일관된다", async () => {
  const [index, app, domain, manifestText, worker, workflow] = await Promise.all([
    read("public/index.html"),
    read("public/js/app.js"),
    read("public/js/domain.js"),
    read("public/manifest.webmanifest"),
    read("public/sw.js"),
    read(".github/workflows/pages.yml")
  ]);
  const manifest = JSON.parse(manifestText);
  assert.match(index, /분양한눈/);
  assert.match(index, /분양 단지/);
  assert.equal(manifest.id, "/bunyanghannun/");
  assert.match(worker, /bunyanghannun-shell-/);
  assert.match(workflow, /group: bunyanghannun-/);
  assert.match(app, /bunyanghannun:saved:v1/);
  assert.doesNotMatch(domain, /"공공임대"|"민간임대"/);
});
