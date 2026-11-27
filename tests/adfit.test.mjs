import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("분양한눈 전용 PC·모바일 AdFit 단위를 분리한다", async () => {
  const config = await read("public/adfit-config.js");
  const units = [...config.matchAll(/unit:\s*"(DAN-[^"]+)"/g)].map((match) => match[1]);
  assert.equal(units.length, 2, "PC 728x90과 모바일 320x100 운영 단위가 모두 필요합니다.");
  assert.equal(new Set(units).size, 2, "PC와 모바일 단위 ID를 재사용하면 안 됩니다.");
  assert.match(config, /hostname:\s*"softm\.github\.io"/);
  assert.match(config, /pathname:\s*"\/bunyanghannun\/"/);
  assert.match(config, /매체\(NKm\)/);
  assert.doesNotMatch(config, /DAN-obc38Zd2XD9940os|DAN-c5FSnJxYcJGNguZZ/);
  assert.match(config, /AdMobNative\\\/1/);
});

test("AdFit은 지연 요청하고 실패 시 광고와 빈 공간을 제거한다", async () => {
  const adfit = await read("public/js/adfit.js");
  const styles = await read("public/styles.css");
  assert.match(adfit, /new IntersectionObserver/);
  assert.match(adfit, /document\.hidden/);
  assert.match(adfit, /dataset\.adOnfail/);
  assert.match(adfit, /10_000/);
  assert.match(adfit, /shell\.remove\(\)/);
  assert.match(adfit, /--adfit-bottom-ad-space/);
  assert.match(styles, /min-height:48px/);
  assert.match(styles, /body\.adfit-bottom-ad-active \.bottom-nav/);
});

test("빌드 자산과 웹 광고 진입점을 연결한다", async () => {
  const [build, app] = await Promise.all([
    read("scripts/build.mjs"),
    read("public/js/app.js")
  ]);
  assert.match(build, /"adfit-config\.js"/);
  assert.match(app, /mountBottomAd\(\)/);
  assert.doesNotMatch(app, /showAdPrivacyOptions/);
});
