# 아키텍처

## 저장소 경계

- `bunyanghannun`: 분양한눈 공식 신규 분양 데이터 수집기, 정적 PWA, 테스트, Pages 배포
- `bunyanghannun.android`: 분양한눈 운영 PWA를 표시하는 Android 셸, 공통 광고·인앱 업데이트, 네이티브 관심단지 알림
- `cheongyakhannun`·`cheongyakhannun.android`: 공식 청약 일정·자격 준비 서비스이며 별도 PWA ID, 저장 키, 캐시, 광고와 Android 패키지를 사용

분양한눈 웹과 Android 앱은 `public/data/notices.json` 계약만 공유합니다. 수집 단계에서 임대 유형을 제외하며 API 인증키는 CI에서만 사용하고 브라우저나 APK에 포함하지 않습니다.

## 데이터 상태

- `ready`: 모든 필수 공식 소스가 수집됨
- `partial`: 한 개 이상은 수집됐지만 다른 소스가 실패하거나 인증키가 없음
- `awaiting_credentials`: 인증키가 필요한 소스를 아직 연결하지 못함
- `error`: 표시할 최신 데이터가 없고 수집도 실패함

오래된 스냅샷을 최신으로 위장하지 않습니다. 각 소스의 `fetchedAt`, `status`, `message`를 UI에 노출합니다.

## 개인정보

첫 버전은 계정을 만들지 않습니다. 관심 지역, 분양 유형, 저장 단지는 `bunyanghannun:*` 브라우저 저장 키 또는 Android 앱 전용 저장소에만 보관됩니다. `내 데이터 삭제` 화면에서 이 기기의 로컬 자료를 직접 지울 수 있으며 청약한눈 저장 자료는 건드리지 않습니다.

