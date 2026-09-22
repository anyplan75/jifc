/**
 * 제주 국제순복음교회 (JIFC) 실시간 통역 시스템 설정
 * Firebase Realtime Database URL / rootPath 만 교회 환경에 맞게 바꾸면 됩니다.
 */
window.JIFC = window.JIFC || {};

JIFC.config = {
  churchName: "제주 국제순복음교회",
  churchNameEn: "Jeju International Full Gospel Church",
  shortName: "JIFC",

  firebase: {
    databaseURL: "https://overlay-lab-default-rtdb.asia-southeast1.firebasedatabase.app",
    rootPath: "jifc",
  },

  defaultModel: "gpt-4o-mini",
  models: [
    { id: "gpt-4o-mini", label: "gpt-4o-mini (빠름·저렴)" },
    { id: "gpt-4o", label: "gpt-4o (고품질)" },
  ],

  // 제주 거주 외국인·이주노동자 비중을 반영한 통역 언어
  // defaultSelected: 송출기 기본 체크 (토큰 절약용). ko는 항상 포함.
  languages: [
    {
      code: "ko", name: "한국어", nameEn: "Korean", flag: "🇰🇷",
      defaultSize: 42, defaultSpacing: -1, defaultSelected: true,
      waiting: "한국어 자막 대기 중...",
      readability: {
        fontSize: 26, lineHeight: 1.78, letterSpacing: "-0.02em",
        wordBreak: "keep-all", fontWeight: 650,
        fontFamily: '"Pretendard", "Noto Sans KR", "Apple SD Gothic Neo", sans-serif',
      },
    },
    {
      code: "en", name: "영어", nameEn: "English", flag: "🇺🇸",
      defaultSize: 32, defaultSpacing: 1, defaultSelected: true,
      waiting: "Waiting for English subtitles...",
      readability: {
        fontSize: 24, lineHeight: 1.65, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", "Helvetica Neue", sans-serif',
      },
    },
    {
      code: "zh-CN", name: "중국어(간체)", nameEn: "Chinese (Simplified)", flag: "🇨🇳",
      defaultSize: 38, defaultSpacing: 1, defaultSelected: true,
      waiting: "等待中文字幕...",
      readability: {
        fontSize: 28, lineHeight: 1.85, letterSpacing: "0.06em",
        wordBreak: "break-all", fontWeight: 600,
        fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      },
    },
    {
      code: "zh-TW", name: "중국어(번체)", nameEn: "Chinese (Traditional)", flag: "🇹🇼",
      defaultSize: 38, defaultSpacing: 1, defaultSelected: false,
      waiting: "等待繁體中文字幕...",
      readability: {
        fontSize: 28, lineHeight: 1.85, letterSpacing: "0.06em",
        wordBreak: "break-all", fontWeight: 600,
        fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',
      },
    },
    {
      code: "ja", name: "일본어", nameEn: "Japanese", flag: "🇯🇵",
      defaultSize: 36, defaultSpacing: 1, defaultSelected: true,
      waiting: "日本語字幕を待っています...",
      readability: {
        fontSize: 26, lineHeight: 1.8, letterSpacing: "0.04em",
        wordBreak: "break-all", fontWeight: 600,
        fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
      },
    },
    {
      code: "vi", name: "베트남어", nameEn: "Vietnamese", flag: "🇻🇳",
      defaultSize: 32, defaultSpacing: 0, defaultSelected: true,
      waiting: "Đang chờ phụ đề tiếng Việt...",
      readability: {
        fontSize: 24, lineHeight: 1.82, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans", "Pretendard", sans-serif',
      },
    },
    {
      code: "th", name: "태국어", nameEn: "Thai", flag: "🇹🇭",
      defaultSize: 32, defaultSpacing: 0, defaultSelected: true,
      waiting: "กำลังรอคำบรรยายภาษาไทย...",
      readability: {
        fontSize: 26, lineHeight: 1.9, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Thai", "Thonburi", sans-serif',
      },
    },
    {
      code: "id", name: "인도네시아어", nameEn: "Indonesian", flag: "🇮🇩",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: true,
      waiting: "Menunggu subtitle Bahasa Indonesia...",
      readability: {
        fontSize: 24, lineHeight: 1.7, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", sans-serif',
      },
    },
    {
      code: "ne", name: "네팔어", nameEn: "Nepali", flag: "🇳🇵",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: true,
      waiting: "नेपाली उपशीर्षक पर्खँदै...",
      readability: {
        fontSize: 28, lineHeight: 1.95, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
      },
    },
    {
      code: "tl", name: "타갈로그어", nameEn: "Tagalog", flag: "🇵🇭",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: true,
      waiting: "Naghihintay ng Tagalog subtitle...",
      readability: {
        fontSize: 24, lineHeight: 1.7, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", sans-serif',
      },
    },
    {
      code: "km", name: "캄보디아어", nameEn: "Khmer", flag: "🇰🇭",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "កំពុងរង់ចាំចំណងជើងខ្មែរ...",
      readability: {
        fontSize: 26, lineHeight: 2.0, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Khmer", "Khmer OS", sans-serif',
      },
    },
    {
      code: "my", name: "미얀마어", nameEn: "Burmese", flag: "🇲🇲",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "မြန်မာစာတန်းထိုး စောင့်ဆိုင်းနေသည်...",
      readability: {
        fontSize: 26, lineHeight: 2.0, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Myanmar", "Myanmar Text", sans-serif',
      },
    },
    {
      code: "mn", name: "몽골어", nameEn: "Mongolian", flag: "🇲🇳",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "Монгол хадмал хүлээж байна...",
      readability: {
        fontSize: 24, lineHeight: 1.75, letterSpacing: "0.015em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans", "Pretendard", sans-serif',
      },
    },
    {
      code: "uz", name: "우즈벡어", nameEn: "Uzbek", flag: "🇺🇿",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "Oʻzbek subtitrlarini kutmoqda...",
      readability: {
        fontSize: 24, lineHeight: 1.7, letterSpacing: "0.01em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Pretendard", "Noto Sans", sans-serif',
      },
    },
    {
      code: "bn", name: "벵골어", nameEn: "Bengali", flag: "🇧🇩",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "বাংলা সাবটাইটেল অপেক্ষা করছে...",
      readability: {
        fontSize: 26, lineHeight: 1.9, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Bengali", "Noto Sans", sans-serif',
      },
    },
    {
      code: "ru", name: "러시아어", nameEn: "Russian", flag: "🇷🇺",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "Ожидание русских субтитров...",
      readability: {
        fontSize: 25, lineHeight: 1.72, letterSpacing: "0.015em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans", "Pretendard", sans-serif',
      },
    },
    {
      code: "si", name: "싱할라어", nameEn: "Sinhala", flag: "🇱🇰",
      defaultSize: 30, defaultSpacing: 0, defaultSelected: false,
      waiting: "සිංහල උපසිරැසි බලාපොරොත්තු වෙමින්...",
      readability: {
        fontSize: 26, lineHeight: 1.95, letterSpacing: "0.02em",
        wordBreak: "normal", fontWeight: 600,
        fontFamily: '"Noto Sans Sinhala", "Noto Sans", sans-serif',
      },
    },
  ],

  livePushMinInterval: 250,
  silenceFlushMs: 2000,
};

JIFC.langByCode = Object.fromEntries(JIFC.config.languages.map((l) => [l.code, l]));
JIFC.targetLangCodes = () => JIFC.config.languages.map((l) => l.code).filter((c) => c !== "ko");
JIFC.defaultSelectedTargets = () =>
  JIFC.config.languages.filter((l) => l.code !== "ko" && l.defaultSelected).map((l) => l.code);
