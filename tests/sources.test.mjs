import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normaliseApplyhomeRow, normaliseLhRow, parseShBoard, SH_BOARDS, dedupeNotices, isBunyangNotice, summariseModels } from "../scripts/sources.mjs";

const applyhomeRow = JSON.parse(await readFile(new URL("./fixtures/applyhome-row.json", import.meta.url), "utf8"));
const shHtml = await readFile(new URL("./fixtures/sh-board.html", import.meta.url), "utf8");

test("청약홈 분양 공고의 일정과 지역을 공통 계약으로 정규화한다", () => {
  const notice = normaliseApplyhomeRow(applyhomeRow, "민간분양");
  assert.equal(notice.id, "applyhome:민간분양:2026000123:2026000123:테스트 로즈 아파트");
  assert.equal(notice.region, "서울");
  assert.equal(notice.district, "서초구");
  assert.equal(notice.applyStart, "2026-11-25");
  assert.equal(notice.applyEnd, "2026-11-27");
  assert.equal(notice.totalUnits, 120);
  assert.ok(notice.tags.includes("분양가상한제"));
});

test("LH 공고의 기관·유형·마감일을 정규화한다", () => {
  const notice = normaliseLhRow({
    PAN_ID: "LH-1", PAN_NM: "고양 행복주택", UPP_AIS_TP_NM: "임대주택", AIS_TP_CD_NM: "행복주택",
    CNP_CD_NM: "경기도", PAN_NT_ST_DT: "2026.11.20", CLSG_DT: "2026.12.01", PAN_SS: "접수중", DTL_URL: "https://apply.lh.or.kr/detail"
  });
  assert.equal(notice.source, "lh");
  assert.equal(notice.region, "경기");
  assert.equal(notice.type, "공공임대");
  assert.equal(notice.applyEnd, "2026-12-01");
});

test("SH 분양 게시판에서 모집공고만 추출하고 결과 공지는 제외한다", () => {
  const notices = parseShBoard(shHtml, SH_BOARDS[0]);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].id, "sh:9001");
  assert.equal(notices[0].region, "서울");
  assert.match(notices[0].officialUrl, /seq=9001/);
});

test("분양한눈은 임대 공고를 제외하고 신규 분양 유형만 허용한다", () => {
  assert.equal(isBunyangNotice({ type: "공공분양" }), true);
  assert.equal(isBunyangNotice({ type: "무순위" }), true);
  assert.equal(isBunyangNotice({ type: "공공임대" }), false);
  assert.equal(isBunyangNotice({ type: "민간임대" }), false);
});

test("주택형 응답에서 면적과 분양가 범위를 요약한다", () => {
  assert.deepEqual(summariseModels([
    { SUPLY_AR: "59.92", LTTOT_TOP_AMOUNT: "48000", HOUSE_TY: "059" },
    { SUPLY_AR: "84.97", LTTOT_TOP_AMOUNT: "62000", HOUSE_TY: "084" }
  ]), {
    minAreaSquareMeter: 59.92,
    maxAreaSquareMeter: 84.97,
    minPriceTenThousand: 48000,
    maxPriceTenThousand: 62000,
    housingTypes: ["059", "084"]
  });
});

test("동일한 공고 ID는 마지막 값 하나만 유지한다", () => {
  const notices = dedupeNotices([{ id: "x", title: "이전", tags: [] }, { id: "x", title: "최신", tags: ["청년", "청년"] }]);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].title, "최신");
  assert.deepEqual(notices[0].tags, ["청년"]);
});

