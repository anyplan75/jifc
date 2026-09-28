# JIFC 안정화 배포본 (cheil에서 export)

제주 국제순복음교회 실시간 통역 — CHEIL과 동일한 STT 교정·문장 절단 안정화 패치입니다.

이 Cloud Agent는 `anyplan75/cheil`에만 push 권한이 있어 `anyplan75/jifc`에 직접 올리지 못했습니다.

## 포함 내용 (CHEIL 동기화)
- 설교용 문장 절단 안정화 (`아닙니다` 등, 조사 꼬리 보류)
- 침묵 flush 3.2초 / 강제 6.5초
- `네네`류 잡음 필터
- STT 오인식 교정 + 교회 용어 glossary + 직전 문맥
- 다국어 JSON 배치 번역·재시도
- Firebase `/jifc`, localStorage `jifc_*` 유지

## jifc 저장소에 넣는 방법
1. Cursor에서 **anyplan75/jifc** 저장소로 Cloud Agent를 연다
2. 「cheil의 `jifc-export`를 jifc `pages` 브랜치 루트로 복사해 배포해줘」라고 요청한다
3. 배포 URL: https://anyplan75.github.io/jifc/

또는 이 폴더 파일을 `anyplan75/jifc`의 `pages` 브랜치 루트에 덮어쓰면 됩니다.
