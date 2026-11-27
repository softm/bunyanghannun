const APPLYHOME_BASE = "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1";
const LH_URL = "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const SH_ORIGIN = "https://www.i-sh.co.kr";

export const APPLYHOME_ENDPOINTS = [
  ["getAPTLttotPblancDetail", "민간분양"],
  ["getUrbtyOfctlLttotPblancDetail", "오피스텔"],
  ["getRemndrLttotPblancDetail", "무순위"],
  ["getOPTLttotPblancDetail", "임의공급"]
];

export const SH_BOARDS = [{
  category: "공공분양",
  listUrl: `${SH_ORIGIN}/app/lay2/program/S1T294C296/www/brd/m_244/list.do?multi_itm_seq=1`,
  detailBase: `${SH_ORIGIN}/app/lay2/program/S1T294C296/www/brd/m_244/view.do`,
  sequence: "1"
}];

export const BUNYANG_TYPES = new Set(["민간분양", "공공분양", "오피스텔", "무순위", "임의공급"]);

function text(value) {
  return value == null ? "" : String(value).trim();
}

export function normaliseDate(value) {
  const match = text(value).match(/(\d{4})[-./]?(\d{2})[-./]?(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function minDate(...values) {
  const dates = values.map(normaliseDate).filter(Boolean).sort();
  return dates[0] || "";
}

function maxDate(...values) {
  const dates = values.map(normaliseDate).filter(Boolean).sort();
  return dates.at(-1) || "";
}

function regionFrom(address, explicit) {
  const source = text(explicit) || text(address).split(/\s+/)[0];
  const pairs = {
    서울특별시: "서울", 경기도: "경기", 인천광역시: "인천", 부산광역시: "부산",
    대구광역시: "대구", 광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산",
    세종특별자치시: "세종", 강원특별자치도: "강원", 강원도: "강원", 충청북도: "충북",
    충청남도: "충남", 전북특별자치도: "전북", 전라북도: "전북", 전라남도: "전남",
    경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주", 전국: "전국"
  };
  return pairs[source] || source.replace(/[특별광역자치도시]/g, "") || "전국";
}

function inferDistrict(address) {
  const parts = text(address).split(/\s+/);
  return parts.find((part, index) => index > 0 && /[시군구]$/.test(part)) || "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function normaliseApplyhomeRow(row, category) {
  const address = text(row.HSSPLY_ADRES || row.HSSPLY_ZIP || row.CNSTRCT_ENTRPS_ADRES);
  const idParts = [category, row.HOUSE_MANAGE_NO, row.PBLANC_NO, row.HOUSE_NM].map(text).filter(Boolean);
  const type = category === "민간분양" && /공공/.test(text(row.HOUSE_SECD_NM)) ? "공공분양" : category;
  const specialStart = minDate(row.SPSPLY_RCEPT_BGNDE);
  const specialEnd = maxDate(row.SPSPLY_RCEPT_ENDDE);
  const applyStart = minDate(
    row.SUBSCRPT_RCEPT_BGNDE,
    row.GNRL_RNK1_CRSPAREA_RCPTDE,
    row.GNRL_RNK1_ETC_GG_RCPTDE,
    row.GNRL_RNK1_ETC_AREA_RCPTDE,
    row.GNRL_RNK2_CRSPAREA_RCPTDE,
    specialStart
  );
  const applyEnd = maxDate(
    row.SUBSCRPT_RCEPT_ENDDE,
    row.GNRL_RNK2_ETC_AREA_RCPTDE,
    row.GNRL_RNK2_ETC_GG_RCPTDE,
    row.GNRL_RNK2_CRSPAREA_RCPTDE,
    row.GNRL_RNK1_ETC_AREA_RCPTDE,
    specialEnd
  );
  const flags = [
    ["SPECLT_RDN_EARTH_AT", "투기과열지구"],
    ["MDAT_TRGET_AREA_SECD", "조정대상지역"],
    ["PARCPRC_ULS_AT", "분양가상한제"]
  ].filter(([field]) => text(row[field]).toUpperCase() === "Y").map(([, label]) => label);
  return {
    id: `applyhome:${idParts.join(":")}`,
    source: "applyhome",
    sourceName: "청약홈",
    title: text(row.HOUSE_NM || row.PBLANC_NM) || "이름 없는 분양 공고",
    region: regionFrom(address, row.SUBSCRPT_AREA_CODE_NM),
    district: inferDistrict(address),
    address,
    type,
    subtype: text(row.HOUSE_DTL_SECD_NM || row.HOUSE_SECD_NM || row.RENT_SECD_NM),
    totalUnits: Number(row.TOT_SUPLY_HSHLDCO || 0) || null,
    publishedAt: normaliseDate(row.RCRIT_PBLANC_DE),
    specialStart,
    specialEnd,
    applyStart,
    applyEnd,
    winnerDate: normaliseDate(row.PRZWNER_PRESNATN_DE),
    contractStart: normaliseDate(row.CNTRCT_CNCLS_BGNDE),
    contractEnd: normaliseDate(row.CNTRCT_CNCLS_ENDDE),
    moveIn: text(row.MVN_PREARNGE_YM),
    officialUrl: text(row.PBLANC_URL || row.HMPG_ADRES),
    homepageUrl: text(row.HMPG_ADRES),
    contact: text(row.MDHS_TELNO),
    provider: text(row.BSNS_MBY_NM || row.CNSTRCT_ENTRPS_NM),
    minAreaSquareMeter: null,
    maxAreaSquareMeter: null,
    minPriceTenThousand: null,
    maxPriceTenThousand: null,
    tags: unique([text(row.HOUSE_SECD_NM), text(row.HOUSE_DTL_SECD_NM), text(row.RENT_SECD_NM), ...flags]),
    stale: false,
    __houseManageNo: text(row.HOUSE_MANAGE_NO),
    __pblancNo: text(row.PBLANC_NO)
  };
}

export function summariseModels(rows = []) {
  const prices = rows.map((row) => Number(row.LTTOT_TOP_AMOUNT || row.SUPLY_AMOUNT || 0)).filter((value) => Number.isFinite(value) && value > 0);
  const areas = rows.map((row) => Number(row.SUPLY_AR || 0)).filter((value) => Number.isFinite(value) && value > 0);
  return {
    minAreaSquareMeter: areas.length ? Math.min(...areas) : null,
    maxAreaSquareMeter: areas.length ? Math.max(...areas) : null,
    minPriceTenThousand: prices.length ? Math.min(...prices) : null,
    maxPriceTenThousand: prices.length ? Math.max(...prices) : null,
    housingTypes: unique(rows.map((row) => text(row.HOUSE_TY || row.TP)))
  };
}

export function extractLhRows(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    const arrays = payload.flatMap((item) => extractLhRows(item));
    if (arrays.length) return arrays;
    return payload.every((item) => item && typeof item === "object") ? payload : [];
  }
  for (const key of ["dsList", "data", "items", "item", "result"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  for (const key of ["body", "response"]) {
    const rows = extractLhRows(payload[key]);
    if (rows.length) return rows;
  }
  return [];
}

export function normaliseLhRow(row) {
  const title = text(row.PAN_NM || row.panNm);
  const category = text(row.UPP_AIS_TP_NM || row.uppAisTpNm);
  const subtype = text(row.AIS_TP_CD_NM || row.aisTpCdNm);
  const region = regionFrom("", row.CNP_CD_NM || row.cnpCdNm);
  const publishedAt = normaliseDate(row.PAN_NT_ST_DT || row.panNtStDt || row.ANNOUNCEMENT_DATE);
  const applyEnd = normaliseDate(row.CLSG_DT || row.clsgDt);
  return {
    id: `lh:${text(row.PAN_ID || row.panId || row.RNUM)}:${title}`,
    source: "lh",
    sourceName: "LH청약플러스",
    title: title || "이름 없는 LH 공고",
    region,
    district: "",
    address: text(row.DTL_ADR || row.ADDRESS),
    type: /분양|신혼희망/.test(`${category} ${subtype}`) ? "공공분양" : "공공임대",
    subtype: subtype || category,
    totalUnits: null,
    publishedAt,
    specialStart: "",
    specialEnd: "",
    applyStart: "",
    applyEnd,
    winnerDate: "",
    contractStart: "",
    contractEnd: "",
    moveIn: "",
    officialUrl: text(row.DTL_URL || row.dtlUrl) || "https://apply.lh.or.kr/lhapply/main.do",
    homepageUrl: "https://apply.lh.or.kr/lhapply/main.do",
    contact: "1600-1004",
    provider: "한국토지주택공사",
    tags: unique([category, subtype, text(row.PAN_SS || row.panSs)]),
    stale: false
  };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseShBoard(html, board) {
  const rows = String(html || "").match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  return rows.flatMap((row) => {
    const link = row.match(/getDetailView\(['\"](\d+)['\"]\)[\s\S]*?<\/a>/i);
    if (!link) return [];
    const anchor = row.match(/<a[^>]*getDetailView\(['\"]\d+['\"]\)[^>]*>([\s\S]*?)<\/a>/i);
    const title = decodeHtml(anchor?.[1]);
    const date = normaliseDate(row.match(/\d{4}-\d{2}-\d{2}/)?.[0]);
    const relevant = /(입주자\s*모집|입주자모집|잔여세대.*모집|청약.*공고|분양주택.*모집)/.test(title);
    const outcome = /(당첨|결과|예비|계약안내|동호배정|서류심사|선정|이전등기|등기시행)/.test(title);
    if (!title || !date || !relevant || outcome) return [];
    const url = new URL(board.detailBase);
    url.searchParams.set("seq", link[1]);
    return [{
      id: `sh:${link[1]}`,
      source: "sh",
      sourceName: "SH인터넷청약시스템",
      title,
      region: "서울",
      district: "",
      address: "서울특별시",
      type: board.category,
      subtype: /청년/.test(title) ? "청년주택" : /장기전세/.test(title) ? "장기전세" : board.category,
      totalUnits: null,
      publishedAt: date,
      specialStart: "",
      specialEnd: "",
      applyStart: "",
      applyEnd: "",
      winnerDate: "",
      contractStart: "",
      contractEnd: "",
      moveIn: "",
      officialUrl: url.href,
      homepageUrl: board.listUrl,
      contact: "1600-3456",
      provider: "서울주택도시개발공사",
      tags: unique([board.category, /청년/.test(title) ? "청년" : "", /신혼/.test(title) ? "신혼" : ""]),
      stale: false
    }];
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Accept: "application/json", "User-Agent": "BunyangHannun/1.0 (+https://softm.github.io/bunyanghannun/)", ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url.origin}${url.pathname}`);
  return response.json();
}

export async function fetchApplyhome(serviceKey, options = {}) {
  if (!serviceKey) throw new Error("DATA_GO_KR_SERVICE_KEY is required for ApplyHome");
  const startDate = options.startDate || new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
  const rows = [];
  for (const [endpoint, category] of APPLYHOME_ENDPOINTS) {
    let page = 1;
    let total = Infinity;
    while (rows.filter((item) => item.__endpoint === endpoint).length < total && page <= 20) {
      const url = new URL(`${APPLYHOME_BASE}/${endpoint}`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("perPage", "100");
      url.searchParams.set("returnType", "JSON");
      url.searchParams.set("serviceKey", serviceKey);
      url.searchParams.set("cond[RCRIT_PBLANC_DE::GTE]", startDate);
      const payload = await fetchJson(url);
      const data = Array.isArray(payload.data) ? payload.data : [];
      total = Number(payload.matchCount ?? payload.totalCount ?? data.length);
      rows.push(...data.map((row) => ({ ...normaliseApplyhomeRow(row, category), __endpoint: endpoint })));
      if (!data.length || data.length < 100) break;
      page += 1;
    }
  }
  const enriched = [];
  for (let index = 0; index < rows.length; index += 8) {
    const batch = rows.slice(index, index + 8);
    enriched.push(...await Promise.all(batch.map((notice) => enrichApplyhomeNotice(notice, serviceKey))));
  }
  return enriched.map(({ __endpoint, __houseManageNo, __pblancNo, ...notice }) => notice).filter(isBunyangNotice);
}

async function enrichApplyhomeNotice(notice, serviceKey) {
  const modelEndpoint = notice.__endpoint === "getAPTLttotPblancDetail"
    ? "getAPTLttotPblancMdl"
    : notice.__endpoint === "getUrbtyOfctlLttotPblancDetail"
      ? "getUrbtyOfctlLttotPblancMdl"
      : "";
  if (!modelEndpoint || !notice.__houseManageNo || !notice.__pblancNo) return notice;
  try {
    const url = new URL(`${APPLYHOME_BASE}/${modelEndpoint}`);
    url.searchParams.set("page", "1");
    url.searchParams.set("perPage", "100");
    url.searchParams.set("returnType", "JSON");
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("cond[HOUSE_MANAGE_NO::EQ]", notice.__houseManageNo);
    url.searchParams.set("cond[PBLANC_NO::EQ]", notice.__pblancNo);
    const payload = await fetchJson(url);
    const summary = summariseModels(Array.isArray(payload.data) ? payload.data : []);
    return { ...notice, ...summary, tags: unique([...(notice.tags || []), ...summary.housingTypes]) };
  } catch {
    return notice;
  }
}

export async function fetchLh(serviceKey, options = {}) {
  if (!serviceKey) throw new Error("DATA_GO_KR_SERVICE_KEY is required for LH");
  const start = options.startDate || new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
  const end = options.endDate || new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
  const all = [];
  for (const typeCode of ["05", "06", "13", "39"]) {
    for (let page = 1; page <= 20; page += 1) {
      const url = new URL(LH_URL);
      url.searchParams.set("ServiceKey", serviceKey);
      url.searchParams.set("PG_SZ", "100");
      url.searchParams.set("PAGE", String(page));
      url.searchParams.set("UPP_AIS_TP_CD", typeCode);
      url.searchParams.set("PAN_NT_ST_DT", start.replaceAll("-", "."));
      url.searchParams.set("CLSG_DT", end.replaceAll("-", "."));
      const payload = await fetchJson(url);
      const rows = extractLhRows(payload).filter((row) => text(row.PAN_NM || row.panNm));
      all.push(...rows.map(normaliseLhRow));
      if (rows.length < 100) break;
    }
  }
  return all.filter(isBunyangNotice);
}

export async function fetchSh(options = {}) {
  const pages = Math.max(1, Math.min(5, Number(options.pages || 3)));
  const lookbackDays = Math.max(30, Math.min(730, Number(options.lookbackDays || 180)));
  const now = options.now instanceof Date ? options.now : new Date();
  const cutoff = new Date(now.getTime() - lookbackDays * 86_400_000).toISOString().slice(0, 10);
  const all = [];
  for (const board of SH_BOARDS) {
    for (let page = 1; page <= pages; page += 1) {
      const body = new URLSearchParams({
        page: String(page),
        seq: "",
        multi_itm_seq: board.sequence,
        multi_itm_seqsStr: board.sequence,
        srchTp: "0",
        srchWord: ""
      });
      const response = await fetch(board.listUrl, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "BunyangHannun/1.0 (+https://softm.github.io/bunyanghannun/)"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} SH ${board.category}`);
      all.push(...parseShBoard(await response.text(), board));
    }
  }
  return all.filter((notice) => notice.publishedAt >= cutoff);
}

export function dedupeNotices(notices) {
  const byId = new Map();
  notices.forEach((notice) => {
    if (!notice?.id || !notice?.title) return;
    byId.set(notice.id, { ...notice, tags: unique(notice.tags || []) });
  });
  return [...byId.values()].sort((a, b) =>
    String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")) || String(a.title).localeCompare(String(b.title), "ko-KR")
  );
}

export function isBunyangNotice(notice) {
  return Boolean(notice && BUNYANG_TYPES.has(notice.type));
}

