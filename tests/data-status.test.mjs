import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../public/", import.meta.url);

test("데이터 현황 페이지는 운영 공고 봉투와 세 공식 원천을 표시한다", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("data-status.html", root), "utf8"),
    readFile(new URL("data-status.js", root), "utf8")
  ]);
  assert.match(html, /데이터 수집 현황 — 분양한눈/);
  assert.match(html, /id="applyhome"/);
  assert.match(html, /id="lh"/);
  assert.match(html, /id="sh"/);
  assert.match(script, /data\/notices\.json/);
  assert.match(script, /envelope\.sources/);
});
