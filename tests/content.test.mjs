import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const privacy = await readFile(new URL("../public/privacy.html", import.meta.url), "utf8");
const deletion = await readFile(new URL("../public/delete-account.html", import.meta.url), "utf8");

test("공고 원문과 일정 변경 유의사항을 사용자에게 반복 안내한다", () => {
  assert.match(index, /기관 원문/);
  assert.match(index, /일정은 변경될 수/);
  assert.match(index, /청약 자격이나 당첨을 보장하지 않습니다/);
});

test("회원가입 없는 로컬 보관 정책과 실제 삭제 동작을 제공한다", () => {
  assert.match(privacy, /회원가입을 제공하지 않으며/);
  assert.match(deletion, /localStorage\.removeItem/);
  assert.match(deletion, /관심조건/);
});

