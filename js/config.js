/**
 * 제주 국제순복음교회 (JIFC) 실시간 통역 시스템 설정
 * Firebase Realtime Database URL / rootPath 만 교회 환경에 맞게 바꾸면 됩니다.
 */
window.JIFC = window.JIFC || {};

JIFC.config = {
  churchName: "제주 국제순복음교회",
  churchNameEn: "Jeju International Full Gospel Church",
  shortName: "JIFC",

  // overlay_lab 과 충돌하지 않도록 /jifc 하위에 데이터를 둡니다.
  // 전용 Firebase 프로젝트를 쓰면 rootPath 를 "" 로 두고 databaseURL 만 바꾸세요.
  firebase: {
    databaseURL: "https://overlay-lab-default-rtdb.asia-southeast1.firebasedatabase.app",
    rootPath: "jifc",
  },

  // 기본 번역 모델 (속도·비용 균형). broadcast 화면에서 변경 가능.
  defaultModel: "gpt-4o-mini",
  models: [
    { id: "gpt-4o-mini", label: "gpt-4o-mini (빠름·저렴)" },
    { id: "gpt-4o", label: "gpt-4o (고품질)" },
  ],

  languages: [
    { code: "ko", name: "한국어", nameEn: "Korean", flag: "🇰🇷", defaultSize: 42, defaultSpacing: -1, waiting: "한국어 자막 대기 중..." },
    { code: "en", name: "영어", nameEn: "English", flag: "🇺🇸", defaultSize: 32, defaultSpacing: 1, waiting: "Waiting for English subtitles..." },
    { code: "zh-CN", name: "중국어", nameEn: "Chinese", flag: "🇨🇳", defaultSize: 38, defaultSpacing: 1, waiting: "等待中文字幕..." },
    { code: "vi", name: "베트남어", nameEn: "Vietnamese", flag: "🇻🇳", defaultSize: 32, defaultSpacing: 0, waiting: "Đang chờ phụ đề tiếng Việt..." },
    { code: "id", name: "인도네시아어", nameEn: "Indonesian", flag: "🇮🇩", defaultSize: 30, defaultSpacing: 0, waiting: "Menunggu subtitle Bahasa Indonesia..." },
    { code: "ne", name: "네팔어", nameEn: "Nepali", flag: "🇳🇵", defaultSize: 30, defaultSpacing: 0, waiting: "नेपाली उपशीर्षक पर्खँदै..." },
    { code: "tl", name: "타갈로그어", nameEn: "Tagalog", flag: "🇵🇭", defaultSize: 30, defaultSpacing: 0, waiting: "Naghihintay ng Tagalog subtitle..." },
    { code: "ru", name: "러시아어", nameEn: "Russian", flag: "🇷🇺", defaultSize: 30, defaultSpacing: 0, waiting: "Ожидание русских субтитров..." },
  ],

  // 라이브 미리보기 Firebase 푸시 최소 간격 (ms)
  livePushMinInterval: 250,
  // 침묵 후 미완성 문장 강제 처리 (ms)
  silenceFlushMs: 2000,
};

JIFC.langByCode = Object.fromEntries(JIFC.config.languages.map((l) => [l.code, l]));
JIFC.targetLangCodes = () => JIFC.config.languages.map((l) => l.code).filter((c) => c !== "ko");
