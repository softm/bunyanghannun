import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const index = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const privacy = await readFile(new URL("../public/privacy.html", import.meta.url), "utf8");
const deletion = await readFile(new URL("../public/delete-account.html", import.meta.url), "utf8");
const app = await readFile(new URL("../public/js/app.js", import.meta.url), "utf8");

test("공고 원문과 일정 변경 유의사항을 사용자에게 반복 안내한다", () => {
  assert.match(index, /기관 원문/);
  assert.match(index, /일정은 변경될 수/);
  assert.match(index, /분양가나 청약 자격, 당첨을 보장하지 않습니다/);
  assert.match(index, /광고성 상담 정보와 공식 분양 공고를 구분/);
});

test("회원가입 없는 로컬 보관 정책과 실제 삭제 동작을 제공한다", () => {
  assert.match(privacy, /회원가입을 제공하지 않으며/);
  assert.match(deletion, /localStorage\.removeItem/);
  assert.match(deletion, /관심단지 조건/);
});

test("알림 설정 닫기는 조건을 저장하지 않고 창만 닫는다", () => {
  assert.match(index, /id="closeWatchButton"[^>]*type="button"/);
  assert.match(app, /closeWatchButton[^\n]+watchDialog\.close/);
});

test("모바일 하단 메뉴는 선택한 작업 영역으로 이동한다", () => {
  assert.match(app, /setView\(button\.dataset\.viewTarget, \{ scroll: true \}\)/);
  assert.match(app, /getBoundingClientRect\(\)\.top - 84/);
  assert.match(app, /options\.scroll \? activeTop/);
});

test("탭과 필터의 선택 상태를 보조기기에 전달한다", () => {
  assert.match(index, /aria-controls="feedView"/);
  assert.match(index, /aria-labelledby="feedTab"/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /handleTabKeydown/);
});

test("웹 관심조건과 Android 알림 약속을 구분한다", () => {
  assert.match(index, /관심단지 조건 저장/);
  assert.match(app, /웹이 닫혀 있을 때 푸시 알림을 보내지는 않습니다/);
  assert.doesNotMatch(app, /Notification\.requestPermission/);
});

test("청약한눈과 역할·저장소·네이티브 브리지를 분리한다", () => {
  assert.match(index, /https:\/\/softm\.github\.io\/cheongyakhannun\//);
  assert.match(app, /bunyanghannun:watch:v1/);
  assert.match(app, /window\.BunyangNative/);
  assert.match(app, /BunyangHannunAndroid/);
  assert.doesNotMatch(app, /window\.CheongyakNative|cheongyak:watch:v1|CheongyakHannunAndroid/);
});

