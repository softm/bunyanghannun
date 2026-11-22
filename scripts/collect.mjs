import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dedupeNotices, fetchApplyhome, fetchLh, fetchSh } from "./sources.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/data/notices.json");
const now = new Date().toISOString();
const key = process.env.DATA_GO_KR_SERVICE_KEY?.trim() || "";

async function previousEnvelope() {
  try { return JSON.parse(await readFile(output, "utf8")); }
  catch { return { notices: [], sources: [] }; }
}

const previous = await previousEnvelope();
const sourceJobs = [
  {
    id: "applyhome",
    name: "한국부동산원 청약홈",
    requiresKey: true,
    officialUrl: "https://www.data.go.kr/data/15098547/openapi.do",
    run: () => fetchApplyhome(key)
  },
  {
    id: "lh",
    name: "LH청약플러스",
    requiresKey: true,
    officialUrl: "https://www.data.go.kr/data/15058530/openapi.do",
    run: () => fetchLh(key)
  },
  {
    id: "sh",
    name: "SH인터넷청약시스템",
    requiresKey: false,
    officialUrl: "https://www.i-sh.co.kr/app/lay2/S1T252C253/contents.do",
    run: () => fetchSh({ pages: 3 })
  }
];

const results = [];
for (const source of sourceJobs) {
  if (source.requiresKey && !key) {
    results.push({ source, status: "awaiting_credentials", rows: [], message: "공공데이터포털 인증키 연결 필요" });
    continue;
  }
  try {
    const rows = await source.run();
    results.push({ source, status: "ready", rows, message: `${rows.length.toLocaleString("ko-KR")}건 수집` });
  } catch (error) {
    results.push({ source, status: "error", rows: [], message: error instanceof Error ? error.message : "수집 실패" });
  }
}

const priorBySource = new Map((previous.notices || []).reduce((pairs, notice) => {
  if (!pairs.some(([id]) => id === notice.source)) pairs.push([notice.source, []]);
  pairs.find(([id]) => id === notice.source)[1].push(notice);
  return pairs;
}, []));

const notices = dedupeNotices(results.flatMap((result) => {
  if (result.status === "ready") return result.rows;
  return (priorBySource.get(result.source.id) || []).map((notice) => ({ ...notice, stale: true }));
}));

const readyCount = results.filter((result) => result.status === "ready").length;
const awaitingCount = results.filter((result) => result.status === "awaiting_credentials").length;
const status = readyCount === results.length
  ? "ready"
  : readyCount > 0
    ? "partial"
    : awaitingCount
      ? "awaiting_credentials"
      : "error";

const envelope = {
  schemaVersion: 1,
  status,
  generatedAt: now,
  noticeCount: notices.length,
  sources: results.map((result) => ({
    id: result.source.id,
    name: result.source.name,
    status: result.status,
    fetchedAt: result.status === "ready" ? now : null,
    message: result.message,
    officialUrl: result.source.officialUrl
  })),
  notices
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(envelope, null, 2)}\n`);
console.log(`분양한눈 공식 데이터: ${status}, ${notices.length}건, ${results.map((item) => `${item.source.id}:${item.status}`).join(", ")}`);

