# 아키텍처

## 저장소 경계

- `bunyanghannun`: 분양한눈 공식 데이터 수집기, 정적 PWA, 테스트, Pages 배포
- `bunyanghannun.android`: 운영 PWA를 표시하는 Android 셸, 공통 광고·인앱 업데이트, 네이티브 조건 알림

웹과 Android 앱은 `public/data/notices.json` 계약만 공유합니다. API 인증키는 CI 수집 단계에서만 사용하고 브라우저나 APK에 포함하지 않습니다.

## 데이터 상태

- `ready`: 모든 필수 공식 소스가 수집됨
- `partial`: 한 개 이상은 수집됐지만 다른 소스가 실패하거나 인증키가 없음
- `awaiting_credentials`: 인증키가 필요한 소스를 아직 연결하지 못함
- `error`: 표시할 최신 데이터가 없고 수집도 실패함

오래된 스냅샷을 최신으로 위장하지 않습니다. 각 소스의 `fetchedAt`, `status`, `message`를 UI에 노출합니다.

## 개인정보

첫 버전은 계정을 만들지 않습니다. 관심 지역, 유형, 저장 공고는 브라우저 또는 Android 앱 로컬 저장소에만 보관됩니다. 외부 SNS 계정이나 서버 보관소를 생성하지 않으므로 계정 삭제 기능은 필요하지 않습니다.

