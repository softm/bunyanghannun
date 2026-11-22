# 청약한눈

청약홈·LH·SH의 공식 공고를 한곳에서 확인하고, 관심 지역과 주택 유형에 맞는 신규 공고와 접수 마감을 놓치지 않도록 돕는 한눈 서비스입니다.

## 제품 원칙

- 공식 원문과 데이터 기준시각을 모든 공고에 표시합니다.
- 광고성 분양과 공공·민간 청약 공고를 섞지 않습니다.
- 자격 판정을 대신하지 않고, 사용자가 원문을 확인할 수 있도록 준비 체크리스트를 제공합니다.
- 웹 PWA는 다음 방문 시 새 공고를 알리고 캘린더 파일을 제공합니다.
- Android 앱은 저장한 조건을 약 6시간마다 확인해 신규 공고와 마감 임박 알림을 보냅니다.

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

인증키가 없더라도 SH 공개 공고 수집을 시도하며, 청약홈·LH는 `awaiting_credentials` 상태로 명확히 표시합니다. 인증키는 공개 파일, URL, 로그에 기록하지 않습니다.

## 배포

GitHub Actions가 테스트·정적 빌드·공식 데이터 수집 후 GitHub Pages 산출물을 배포하도록 구성되어 있습니다. 저장소 Secret `DATA_GO_KR_SERVICE_KEY`가 필요합니다.

운영 URL: `https://softm.github.io/bunyanghannun/`

