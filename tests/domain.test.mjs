import test from "node:test";
import assert from "node:assert/strict";
import {
  createNoticeIcs,
  filterNotices,
  getDday,
  getNoticePhase,
  matchesWatchProfile,
  parseDate,
  sanitizeWatchProfile,
  sortNotices
} from "../public/js/domain.js";

const now = new Date("2026-11-22T12:00:00+09:00");
const notices = [
  { id: "1", title: "서울 오늘 접수", region: "서울", type: "민간분양", publishedAt: "2026-11-20", applyStart: "2026-11-22", applyEnd: "2026-11-22" },
  { id: "2", title: "경기 예정", region: "경기", type: "공공분양", publishedAt: "2026-11-21", applyStart: "2026-11-25", applyEnd: "2026-11-27" },
  { id: "3", title: "부산 마감", region: "부산", type: "오피스텔", publishedAt: "2026-11-01", applyStart: "2026-11-04", applyEnd: "2026-11-05" }
];

test("공고 상태와 D-day를 한국 날짜 기준으로 계산한다", () => {
  assert.equal(getNoticePhase(notices[0], now).id, "open");
  assert.equal(getNoticePhase(notices[1], now).id, "upcoming");
  assert.equal(getNoticePhase(notices[2], now).id, "closed");
  assert.equal(getDday("2026-11-25", now), "D-3");
  assert.equal(getDday("2026-11-22", now), "D-DAY");
});

test("관심 지역과 유형을 모두 만족할 때만 알림 대상이다", () => {
  const profile = sanitizeWatchProfile({ enabled: true, regions: ["서울"], types: ["민간분양"] });
  assert.equal(matchesWatchProfile(notices[0], profile), true);
  assert.equal(matchesWatchProfile(notices[1], profile), false);
  assert.deepEqual(sanitizeWatchProfile({ enabled: true, regions: ["잘못된지역"], types: ["민간분양", "가짜"] }).regions, []);
});

test("검색·필터·마감 임박 정렬을 결합한다", () => {
  assert.deepEqual(filterNotices(notices, { region: "서울", query: "오늘" }, now).map((item) => item.id), ["1"]);
  assert.deepEqual(filterNotices(notices, { phase: "active" }, now).map((item) => item.id), ["1", "2"]);
  assert.deepEqual(sortNotices(notices, "deadline", now).map((item) => item.id), ["1", "2", "3"]);
});

test("존재하지 않는 날짜를 일정으로 허용하지 않는다", () => {
  assert.equal(parseDate("2026-02-31"), null);
  assert.ok(parseDate("2026-02-28") instanceof Date);
});

test("공고 일정을 표준 ICS로 만든다", () => {
  const ics = createNoticeIcs({ ...notices[1], sourceName: "LH", officialUrl: "https://apply.lh.or.kr/" });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261125/);
  assert.match(ics, /DTEND;VALUE=DATE:20261128/);
  assert.match(ics, /URL:https:\/\/apply\.lh\.or\.kr\//);
  assert.match(ics, /\[분양한눈\]/);
});

