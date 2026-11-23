import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../public/", import.meta.url);
const index = await readFile(new URL("index.html", root), "utf8");
const app = await readFile(new URL("js/app.js", root), "utf8");
const worker = await readFile(new URL("sw.js", root), "utf8");
const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", root), "utf8"));
const build = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");

test("첫 문서에 시작 화면과 설치 진입점이 있다", () => {
  assert.match(index, /id="bootSplash"/);
  assert.match(index, /분양한눈/);
  assert.match(index, /id="installButton"/);
  assert.match(app, /beforeinstallprompt/);
  assert.match(app, /display-mode: standalone/);
  assert.match(app, /AdMobNative\\\/1/);
});

test("매니페스트는 설치·maskable·바로가기를 제공한다", () => {
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.id);
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => String(icon.purpose).includes("maskable")));
  assert.ok(manifest.shortcuts.length >= 3);
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url.includes("phase=open")));
});

test("버전 CSS와 SUIT 폰트를 같은 경로 묶음으로 배포한다", () => {
  assert.match(build, /assets\/fonts\/SUIT-Variable\.woff2/);
});

test("서비스 워커는 앱 셸만 캐시하고 운영 데이터는 제외한다", () => {
  assert.match(worker, /BUILD_ASSETS/);
  assert.match(worker, /url\.pathname\.includes\('\/data\/'\)/);
  assert.doesNotMatch(worker, /data\/notices\.json['"]/);
  assert.match(worker, /caches\.match\('\.\/'\)/);
});

test("공식 공고와 데모 데이터를 명확히 분리한다", async () => {
  const live = JSON.parse(await readFile(new URL("data/notices.json", root), "utf8"));
  const demo = JSON.parse(await readFile(new URL("data/sample-notices.json", root), "utf8"));
  assert.notEqual(live.status, "demo");
  assert.equal(demo.status, "demo");
  assert.ok(demo.notices.every((notice) => notice.demo === true));
});

