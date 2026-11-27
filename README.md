# 분양한눈

청약홈·LH·SH의 공식 신규 분양 공고를 모아 지역·유형별로 찾고, 세대수·전용면적·분양가·입주예정과 일정을 비교하는 한눈 서비스입니다.

## 제품 원칙

- 분양주택·무순위·오피스텔 등 신규 분양 탐색 대상만 표시하고 공공·민간 임대는 `청약한눈`에서 다룹니다.
- 광고성 상담 단지와 공식 공고를 섞지 않습니다.
- 공식 원문과 데이터 기준시각을 표시하고 가격·면적·일정 변경 가능성을 안내합니다.
- 청약 자격·순위·접수 준비는 [청약한눈](https://softm.github.io/cheongyakhannun/)으로 연결합니다.
- 웹 PWA와 Android 앱은 분양한눈 전용 저장 키·캐시·알림 작업명을 사용합니다.

## 로컬 실행

```bash
npm test
npm run check
npm run build
npm run dev
```

`http://127.0.0.1:4173/?demo=1`에서 데모 데이터로 전체 사용자 흐름을 확인할 수 있습니다.

## 공식 데이터 수집

```bash
DATA_GO_KR_SERVICE_KEY='발급받은 키' npm run collect
```

인증키가 없더라도 SH 공개 분양 공고 수집을 시도하며, 청약홈·LH는 `awaiting_credentials` 상태로 명확히 표시합니다. 인증키는 공개 파일, URL, 로그에 기록하지 않습니다.

## 배포

GitHub Actions가 테스트·정적 빌드·공식 데이터 수집 후 GitHub Pages 산출물을 배포하도록 구성되어 있습니다. 저장소 Secret `DATA_GO_KR_SERVICE_KEY`가 필요합니다.

운영 URL: `https://softm.github.io/bunyanghannun/`

