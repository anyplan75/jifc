/**
 * 송출기 로직
 * - Web Speech STT → 문장 절단 → 한국어 즉시 송출 → 활성 언어만 AI 번역
 * - Firebase 실시간 update (PATCH 폴링 제거)
 */
window.JIFC = window.JIFC || {};

JIFC.broadcast = (() => {
  const state = {
    recognition: null,
    isBroadcasting: false,
    apiKey: "",
    model: JIFC.config.defaultModel,
    rootFolderHandle: null,
    sessionFolderHandle: null,
    totalProcessedLength: 0,
    globalUnprocessedText: "",
    currentSentenceId: Date.now(),
    lastSpeechTime: Date.now(),
    silenceTimer: null,
    lastLivePushTime: 0,
    sessionFullTexts: {},
    enabledTargets: null, // null = 전부
  };

  function resetSessionTexts() {
    state.sessionFullTexts = {};
    JIFC.config.languages.forEach((l) => {
      state.sessionFullTexts[l.code] = [];
    });
  }

  function saveApiKey(key) {
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-")) throw new Error("올바른 OpenAI API 키 형식이 아닙니다. (sk- 로 시작)");
    state.apiKey = trimmed;
    localStorage.setItem("jifc_openai_key", trimmed);
  }

  function loadApiKey() {
    state.apiKey = localStorage.getItem("jifc_openai_key") || "";
    return state.apiKey;
  }

  function saveModel(model) {
    state.model = model;
    localStorage.setItem("jifc_openai_model", model);
  }

  function loadModel() {
    state.model = localStorage.getItem("jifc_openai_model") || JIFC.config.defaultModel;
    return state.model;
  }

  async function connectLocalFolder() {
    state.rootFolderHandle = await window.showDirectoryPicker();
    return state.rootFolderHandle;
  }

  async function saveTextToFile(filename, content) {
    if (!state.sessionFolderHandle) return;
    try {
      const fileHandle = await state.sessionFolderHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (_) {
      /* 폴더 권한 문제 시 무시 */
    }
  }

  async function pushLiveKorean(text, msgId, isFinal) {
    const now = Date.now();
    if (!isFinal && now - state.lastLivePushTime < JIFC.config.livePushMinInterval) return;
    state.lastLivePushTime = now;
    try {
      await JIFC.db.update("subtitles", {
        _timestamp: now,
        ko: { text, id: msgId, isFinal: !!isFinal },
      });
    } catch (_) {}
    if (!isFinal) saveTextToFile("temp_live.txt", text);
  }

  const TARGETS_KEY = "jifc_broadcast_targets";

  function loadSavedTargets() {
    try {
      const raw = localStorage.getItem(TARGETS_KEY);
      if (!raw) return JIFC.defaultSelectedTargets();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return JIFC.defaultSelectedTargets();
      const valid = parsed.filter((c) => c !== "ko" && JIFC.langByCode[c]);
      return valid.length ? valid : JIFC.defaultSelectedTargets();
    } catch (_) {
      return JIFC.defaultSelectedTargets();
    }
  }

  function saveTargets(codes) {
    const valid = (codes || []).filter((c) => c !== "ko" && JIFC.langByCode[c]);
    localStorage.setItem(TARGETS_KEY, JSON.stringify(valid));
    state.enabledTargets = valid;
    return valid;
  }

  function setEnabledTargets(codes) {
    return saveTargets(codes);
  }

  function getEnabledTargets() {
    if (Array.isArray(state.enabledTargets) && state.enabledTargets.length) {
      return state.enabledTargets;
    }
    state.enabledTargets = loadSavedTargets();
    return state.enabledTargets;
  }

  /** 송출기에서 고른 언어만 API 번역 대상으로 사용 */
  function loadEnabledTargets() {
    state.enabledTargets = getEnabledTargets();
    return Promise.resolve(state.enabledTargets);
  }

  /** 선택 언어를 Firebase settings에 반영 → 오버레이/모니터 show 동기화 */
  async function syncSettingsForTargets(targets) {
    const existing = (await JIFC.db.get("settings")) || {};
    const next = {
      _timestamp: Date.now(),
      global: existing.global || {
        layout: "bottom",
        align: "center",
        color: "#ffffff",
        bgColor: "#000000",
        bgOpacity: 0.7,
      },
    };
    JIFC.config.languages.forEach((lang) => {
      const prev = existing[lang.code] || {};
      const selected = lang.code === "ko" || targets.includes(lang.code);
      next[lang.code] = {
        show: selected,
        fontSize: prev.fontSize || lang.defaultSize,
        letterSpacing: prev.letterSpacing !== undefined ? prev.letterSpacing : lang.defaultSpacing,
      };
    });
    await JIFC.db.set("settings", next);
    return next;
  }

  function buildOverlayLinks(targets, origin) {
    const base = (origin || location.origin + location.pathname.replace(/[^/]*$/, "")).replace(/\/?$/, "/");
    const codes = ["ko", ...targets];
    return codes.map((code) => {
      const meta = JIFC.langByCode[code] || { code, name: code, flag: "", nameEn: code };
      return {
        code,
        name: meta.name,
        nameEn: meta.nameEn,
        flag: meta.flag,
        overlay: `${base}overlay.html?lang=${encodeURIComponent(code)}`,
        listen: `${base}listen.html?lang=${encodeURIComponent(code)}`,
      };
    });
  }

  function highlightDifferences(origText, corrText) {
    const origWords = origText.trim().split(/\s+/);
    const corrWords = corrText.trim().split(/\s+/);
    return corrWords
      .map((word, idx) => {
        if (idx >= origWords.length || origWords[idx] !== word) {
          return `<span class="diff">${JIFC.viewer.escapeHtml(word)}</span>`;
        }
        return JIFC.viewer.escapeHtml(word);
      })
      .join(" ");
  }

  function createRecognition(handlers) {
    if (!("webkitSpeechRecognition" in window)) {
      throw new Error("Google Chrome 브라우저를 사용해 주세요.");
    }
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onstart = () => {
      state.totalProcessedLength = 0;
      resetSessionTexts();
      handlers.onStart && handlers.onStart();
    };

    recognition.onresult = (event) => {
      state.lastSpeechTime = Date.now();
      let totalText = "";
      for (let i = 0; i < event.results.length; ++i) {
        totalText += event.results[i][0].transcript;
      }

      let unprocessedText = totalText.substring(state.totalProcessedLength);
      let match = JIFC.sentence.findCutMatch(unprocessedText);
      while (match) {
        const cutIndex = match.index + match[0].length;
        const sentenceToProcess = unprocessedText.substring(0, cutIndex).trim();
        const liveOn = handlers.isLiveOn ? handlers.isLiveOn() : true;

        if (liveOn) pushLiveKorean(sentenceToProcess, state.currentSentenceId, false);

        state.totalProcessedLength += cutIndex;
        unprocessedText = totalText.substring(state.totalProcessedLength);

        const idToProcess = state.currentSentenceId;
        state.currentSentenceId = Date.now();

        if (sentenceToProcess.length > 0) {
          handlers.onSentence && handlers.onSentence(sentenceToProcess, idToProcess);
          processTranslation(sentenceToProcess, idToProcess, handlers);
        }
        match = JIFC.sentence.findCutMatch(unprocessedText);
      }

      const liveText = unprocessedText.trim();
      const liveOn = handlers.isLiveOn ? handlers.isLiveOn() : true;
      if (liveText) {
        handlers.onInterim && handlers.onInterim(liveText);
        if (liveOn) pushLiveKorean(liveText, state.currentSentenceId, false);
      } else {
        handlers.onInterim && handlers.onInterim("");
      }
      state.globalUnprocessedText = unprocessedText;
    };

    recognition.onend = () => {
      if (state.isBroadcasting) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (_) {}
        }, 10);
      }
    };

    recognition.onerror = (e) => {
      handlers.onError && handlers.onError(e.error || "speech-error");
    };

    state.recognition = recognition;
    return recognition;
  }

  async function processTranslation(koreanText, msgId, handlers) {
    handlers.onTranslateStart && handlers.onTranslateStart(koreanText, msgId);
    try {
      const targets = state.enabledTargets || (await loadEnabledTargets());
      const result = await JIFC.translator.translate(koreanText, {
        apiKey: state.apiKey,
        model: state.model,
        targetCodes: targets,
      });

      const highlighted = highlightDifferences(koreanText, result.ko);
      handlers.onTranslateDone && handlers.onTranslateDone(koreanText, msgId, highlighted, result);

      const payload = { _timestamp: Date.now() };
      const codes = ["ko", ...targets];
      for (const lang of codes) {
        if (!result[lang]) continue;
        saveTextToFile(`${lang}.txt`, result[lang]);
        if (!state.sessionFullTexts[lang]) state.sessionFullTexts[lang] = [];
        state.sessionFullTexts[lang].push(result[lang]);
        payload[lang] = { text: result[lang], id: msgId, isFinal: true };
      }
      await JIFC.db.update("subtitles", payload);
    } catch (err) {
      handlers.onTranslateError && handlers.onTranslateError(koreanText, msgId, err.message || String(err));
    }
  }

  async function startBroadcast(handlers) {
    if (!state.apiKey) throw new Error("API 키를 먼저 입력하고 저장해 주세요.");
    if (!state.rootFolderHandle) throw new Error("먼저 저장 폴더를 연결해 주세요.");

    await JIFC.db.init();
    const targets = getEnabledTargets();
    if (!targets.length) {
      throw new Error("번역할 언어를 하나 이상 선택해 주세요. (한국어는 항상 포함됩니다)");
    }
    state.enabledTargets = targets;
    await syncSettingsForTargets(targets);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const folderName = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    state.sessionFolderHandle = await state.rootFolderHandle.getDirectoryHandle(folderName, { create: true });

    state.isBroadcasting = true;
    state.totalProcessedLength = 0;
    state.globalUnprocessedText = "";
    state.currentSentenceId = Date.now();
    resetSessionTexts();

    if (!state.recognition) createRecognition(handlers);
    state.recognition.start();

    state.silenceTimer = setInterval(() => {
      if (!state.isBroadcasting) return;
      const silenceDuration = Date.now() - state.lastSpeechTime;
      if (silenceDuration > JIFC.config.silenceFlushMs && state.globalUnprocessedText.trim().length > 0) {
        const sentenceToProcess = state.globalUnprocessedText.trim();
        const liveOn = handlers.isLiveOn ? handlers.isLiveOn() : true;
        if (liveOn) pushLiveKorean(sentenceToProcess, state.currentSentenceId, false);

        state.totalProcessedLength += state.globalUnprocessedText.length;
        state.globalUnprocessedText = "";

        const idToProcess = state.currentSentenceId;
        state.currentSentenceId = Date.now();
        handlers.onSentence && handlers.onSentence(sentenceToProcess, idToProcess);
        processTranslation(sentenceToProcess, idToProcess, handlers);
        handlers.onInterim && handlers.onInterim("");
      }
    }, 500);

    const links = buildOverlayLinks(targets);
    handlers.onLinksReady && handlers.onLinksReady(links, targets);
    return links;
  }

  async function stopBroadcast(handlers) {
    state.isBroadcasting = false;
    clearInterval(state.silenceTimer);
    if (state.recognition) state.recognition.stop();

    if (state.globalUnprocessedText.trim().length > 0) {
      const sentenceToProcess = state.globalUnprocessedText.trim();
      state.globalUnprocessedText = "";
      await processTranslation(sentenceToProcess, Date.now(), handlers || {});
    }

    setTimeout(async () => {
      if (!state.sessionFolderHandle) return;
      for (const lang of Object.keys(state.sessionFullTexts)) {
        if (!state.sessionFullTexts[lang].length) continue;
        try {
          const fullTextCombined = state.sessionFullTexts[lang].join("\n");
          const fileHandle = await state.sessionFolderHandle.getFileHandle(`${lang}_full.txt`, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(fullTextCombined);
          await writable.close();
        } catch (_) {}
      }
      handlers && handlers.onSaved && handlers.onSaved();
    }, 1500);

    try {
      await JIFC.db.set("subtitles", { _timestamp: Date.now() });
    } catch (_) {}
  }

  return {
    state,
    saveApiKey,
    loadApiKey,
    saveModel,
    loadModel,
    connectLocalFolder,
    createRecognition,
    startBroadcast,
    stopBroadcast,
    loadEnabledTargets,
    loadSavedTargets,
    saveTargets,
    setEnabledTargets,
    getEnabledTargets,
    buildOverlayLinks,
    syncSettingsForTargets,
  };
})();