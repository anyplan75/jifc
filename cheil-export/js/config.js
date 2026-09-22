/**
 * 서귀포제일교회 (CHEIL) 실시간 통역 시스템 설정
 * Firebase Realtime Database URL / rootPath 만 교회 환경에 맞게 바꾸면 됩니다.
 */
window.JIFC = window.JIFC || {};

JIFC.config = {
  churchName: "서귀포제일교회",
  churchNameEn: "Seogwipo Jeil Church",
  shortName: "CHEIL",

  // jifc 와 충돌하지 않도록 /cheil 하위에 데이터를 둡니다.
  // 전용 Firebase 프로젝트를 쓰면 rootPath 를 "" 로 두고 databaseURL 만 바꾸세요.
  firebase: {
    databaseURL: "https://overlay-lab-default-rtdb.asia-southeast1.firebasedatabase.app",
    rootPath: "cheil",
  },

  // 기본 번역 모델 (속도·비용 균형). broadcast 화면에서 변경 가능.
  defaultModel: "gpt-4o-mini",
  models: [
    { id: "gpt-4o-mini", label: "gpt-4o-mini (빠름·저렴)" },
    { id: "gpt-4o", label: "gpt-4o (고품질)" },
  ],

  // readability: 휴대폰 개인 청취(listen)용 언어별 기본 타이포
  languages: [
    {
      code: "ko", name: "한국어", nameEn: "Korean", flag: "🇰🇷",
      defaultSize: 42, defaultSpacing: -1,
      waiting: "한국어 자막 대기 중...",
      readability: {
        fontSize: 26, lineHeight: 1.78, letterSpacing: "-0.02em",
        wordBreak: "keep-all", fontWeight: 650,
        fontFamily: '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      },
    },
    {
      code: "en", name: "영어", nameEn: "English", flag: "🇺🇸",
      defaultSize: 32, defaultSpacing: 1,
      waiting: "Waiting for English subtitles...",
      readability: {
        fontSize: 24, lineHeight: 1.65, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", "Helvetica Neue", sans-serif',
      },
    },
    {
      code: "zh-CN", name: "중국어", nameEn: "Chinese", flag: "🇨🇳",
      defaultSize: 38, defaultSpacing: 1,
      waiting: "等待中文字幕...",
      readability: {
        fontSize: 28, lineHeight: 1.85, letterSpacing: "0.06em",
        wordBreak: "break-all", fontWeight: 600,
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      },
    },
    {
      code: "vi", name: "베트남어", nameEn: "Vietnamese", flag: "🇻🇳",
      defaultSize: 32, defaultSpacing: 0,
      waiting: "Đang chờ phụ đề tiếng Việt...",
      readability: {
        fontSize: 24, lineHeight: 1.82, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans", "Pretendard", sans-serif',
      },
    },
    {
      code: "id", name: "인도네시아어", nameEn: "Indonesian", flag: "🇮🇩",
      defaultSize: 30, defaultSpacing: 0,
      waiting: "Menunggu subtitle Bahasa Indonesia...",
      readability: {
        fontSize: 24, lineHeight: 1.7, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", sans-serif',
      },
    },
    {
      code: "ne", name: "네팔어", nameEn: "Nepali", flag: "🇳🇵",
      defaultSize: 30, defaultSpacing: 0,
      waiting: "नेपाली उपशीर्षक पर्खँदै...",
      readability: {
        fontSize: 28, lineHeight: 1.95, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
      },
    },
    {
      code: "tl", name: "타갈로그어", nameEn: "Tagalog", flag: "🇵🇭",
      defaultSize: 30, defaultSpacing: 0,
      waiting: "Naghihintay ng Tagalog subtitle...",
      readability: {
        fontSize: 24, lineHeight: 1.7, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", sans-serif',
      },
    },
    {
      code: "ru", name: "러시아어", nameEn: "Russian", flag: "🇷🇺",
      defaultSize: 30, defaultSpacing: 0,
      waiting: "Ожидание русских субтитров...",
      readability: {
        fontSize: 25, lineHeight: 1.72, letterSpacing: "0.015em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans", "Pretendard", sans-serif',
      },
    },
  ],

  livePushMinInterval: 250,
  silenceFlushMs: 2000,
};

JIFC.langByCode = Object.fromEntries(JIFC.config.languages.map((l) => [l.code, l]));
JIFC.targetLangCodes = () => JIFC.config.languages.map((l) => l.code).filter((c) => c !== "ko");
