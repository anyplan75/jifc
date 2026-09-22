/**
 * 오버레이 / 모바일 청취 공통 뷰어
 * Firebase 실시간 구독으로 폴링 제거
 */
window.JIFC = window.JIFC || {};

JIFC.viewer = (() => {
  function queryLang(fallback = "en") {
    const params = new URLSearchParams(location.search);
    const lang = params.get("lang") || fallback;
    return JIFC.langByCode[lang] ? lang : fallback;
  }

  function hexToRgba(hex, opacity) {
    const h = String(hex || "#000000").replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) || 0;
    const g = parseInt(h.substring(2, 4), 16) || 0;
    const b = parseInt(h.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * OBS/방송용 오버레이
   * @param {{ lang: string, container: HTMLElement, subtitle: HTMLElement }} opts
   */
  function startOverlay(opts) {
    const lang = opts.lang;
    const container = opts.container;
    const subtitle = opts.subtitle;
    let lastTime = 0;
    let subtitleLines = [];
    let maxLines = 3;

    const meta = JIFC.langByCode[lang];
    subtitle.textContent = meta ? meta.waiting : "Waiting...";

    function applySettings(settings) {
      if (!settings) return;
      if (settings.global) {
        const layout = settings.global.layout || "bottom";
        container.className = "layout-" + layout;
        maxLines = layout === "top" || layout === "bottom" ? 3 : 15;
        subtitle.style.textAlign = settings.global.align || "center";
        subtitle.style.color = settings.global.color || "#ffffff";
        const op = settings.global.bgOpacity !== undefined ? settings.global.bgOpacity : 0.7;
        subtitle.style.backgroundColor = hexToRgba(settings.global.bgColor || "#000000", op);
      }
      const langSetting = settings[lang];
      if (langSetting) {
        container.style.display = langSetting.show === false ? "none" : "flex";
        if (langSetting.fontSize) subtitle.style.fontSize = langSetting.fontSize + "px";
        if (langSetting.letterSpacing !== undefined) {
          subtitle.style.letterSpacing = langSetting.letterSpacing + "px";
        }
      }
    }

    function applySubtitles(subtitles) {
      if (!subtitles || subtitles._timestamp === lastTime) return;
      lastTime = subtitles._timestamp;
      const n = subtitles[lang];
      if (!n) return;

      const text = typeof n === "object" ? n.text : n;
      const msgId = typeof n === "object" ? n.id : lastTime;
      const isFinal = typeof n === "object" && n.isFinal !== undefined ? n.isFinal : true;

      const existingIndex = subtitleLines.findIndex((line) => line.id === msgId);
      if (existingIndex !== -1) {
        subtitleLines[existingIndex].text = text;
        subtitleLines[existingIndex].isFinal = isFinal;
      } else {
        subtitleLines.push({ id: msgId, text, isFinal });
        while (subtitleLines.length > maxLines) subtitleLines.shift();
      }

      subtitle.innerHTML = subtitleLines
        .map((line) => {
          if (line.isFinal === false) {
            return `<span class="interim">${escapeHtml(line.text)}</span>`;
          }
          return escapeHtml(line.text);
        })
        .join("<br>");
    }

    JIFC.db.init().then(() => {
      JIFC.db.onValue("settings", applySettings);
      JIFC.db.onValue("subtitles", applySubtitles);
    });
  }

  /**
   * 모바일 청취(프롬프터)
   * @param {{ langSelect: HTMLSelectElement, scriptBox: HTMLElement, maxLines?: number }} opts
   */
  function startPrompter(opts) {
    const langSelect = opts.langSelect;
    const scriptBox = opts.scriptBox;
    const maxLines = opts.maxLines || 50;
    let lastTime = 0;
    let lines = [];
    let currentLang = langSelect.value;
    let latestPayload = null;

    function clearScreen(message) {
      lines = [];
      scriptBox.innerHTML = `<p class="waiting">${escapeHtml(message)}</p>`;
    }

    function renderLines() {
      scriptBox.innerHTML = lines
        .map((line) => {
          const cls = line.isFinal === false ? "interim" : "";
          return `<p class="${cls}">${escapeHtml(line.text)}</p>`;
        })
        .join("");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }

    function ingestLatestForLang(force = false) {
      if (!latestPayload) return false;
      const n = latestPayload[currentLang];
      if (!n) return false;

      const text = typeof n === "object" ? n.text : n;
      const msgId = typeof n === "object" ? n.id : latestPayload._timestamp;
      const isFinal = typeof n === "object" && n.isFinal !== undefined ? n.isFinal : true;

      if (force) {
        lines = [{ id: msgId, text, isFinal }];
        renderLines();
        return true;
      }

      const existingIndex = lines.findIndex((line) => line.id === msgId);
      if (existingIndex !== -1) {
        lines[existingIndex].text = text;
        lines[existingIndex].isFinal = isFinal;
      } else {
        lines.push({ id: msgId, text, isFinal });
        if (lines.length > maxLines) lines.shift();
      }
      renderLines();
      return true;
    }

    langSelect.addEventListener("change", () => {
      currentLang = langSelect.value;
      if (ingestLatestForLang(true)) {
        lastTime = latestPayload ? latestPayload._timestamp : 0;
      } else {
        lastTime = 0;
        clearScreen("언어가 변경되었습니다. 다음 문장을 기다리는 중입니다...");
      }
    });

    function applySubtitles(subtitles) {
      if (!subtitles) return;
      latestPayload = subtitles;
      if (subtitles._timestamp === lastTime) return;
      lastTime = subtitles._timestamp;
      ingestLatestForLang(false);
    }

    JIFC.db.init().then(() => {
      JIFC.db.onValue("subtitles", applySubtitles);
    });

    return { clearScreen };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillLangSelect(selectEl, selected, allowedCodes) {
    const fallback = ["ko", ...JIFC.defaultSelectedTargets()].map((c) => JIFC.langByCode[c]).filter(Boolean);
    let langs = JIFC.config.languages;
    if (Array.isArray(allowedCodes)) {
      const allow = new Set(allowedCodes);
      langs = JIFC.config.languages.filter((l) => allow.has(l.code));
    }
    if (!langs.length) langs = fallback.length ? fallback : JIFC.config.languages.slice(0, 1);

    const preferred = langs.some((l) => l.code === selected) ? selected : langs[0].code;
    selectEl.innerHTML = langs
      .map((l) => {
        const sel = l.code === preferred ? " selected" : "";
        return `<option value="${l.code}"${sel}>${l.flag} ${l.name} (${l.nameEn})</option>`;
      })
      .join("");
    return preferred;
  }

  /**
   * 송출기가 기록한 activeTargets 우선.
   * 없으면 show===true 만. 둘 다 없으면 추천 언어.
   */
  function activeLangCodesFromSettings(settings) {
    const fallback = ["ko", ...JIFC.defaultSelectedTargets()];
    if (!settings) return fallback;

    if (Array.isArray(settings.activeTargets) && settings.activeTargets.length) {
      const codes = settings.activeTargets.filter((c) => JIFC.langByCode[c]);
      return codes.length ? codes : fallback;
    }

    const active = JIFC.config.languages
      .filter((l) => settings[l.code] && settings[l.code].show === true)
      .map((l) => l.code);
    return active.length ? active : fallback;
  }

  return { queryLang, startOverlay, startPrompter, fillLangSelect, activeLangCodesFromSettings, escapeHtml, hexToRgba };
})();
