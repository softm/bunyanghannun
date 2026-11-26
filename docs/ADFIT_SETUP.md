# 청약한눈 Kakao AdFit 운영

- AdFit 계정: 승인된 운영 계정
- 웹 매체: `청약한눈`
- 매체 ID: `NKm`
- 운영 URL: `https://softm.github.io/bunyanghannun/`
- PC 하단 728×90: `DAN-iRADVNYvQvGxjcdU`
- 모바일 하단 320×100: `DAN-jT5C5ojnNK2xQIkp`

광고는 운영 호스트와 `/bunyanghannun/` 경로에서만 요청한다. 화면에 보일 때 SDK를 한 번만 로드하며 `NOAD`, SDK 오류, 10초 무응답, 광고 규격보다 좁은 화면에서는 광고와 빈 공간을 제거한다. WebView User-Agent에 `AdMobNative/1`이 있으면 네이티브 AdMob과 중복되지 않도록 AdFit 네트워크 요청을 만들지 않는다.

웹 코드는 광고 DOM이나 SDK를 반복 생성하지 않는다. 광고 단위 자체의 소재 갱신은 AdFit 콘솔 설정을 따르며, 하단 광고는 한 지면만 만들고 사용자가 48px 이상의 버튼으로 접고 펼칠 수 있다.

실제 송출은 AdFit 매체 심사와 광고 재고에 따라 달라질 수 있다. 매체 심사 완료 전의 코드 적용·첫 요청과 실제 광고 송출은 구분해 확인한다.
