/**
 * OpenAI 기반 교정·번역 (안정성 우선)
 * - STT 오인식은 예배 문맥으로 교정 허용
 * - 언어 많을 때 배치 번역으로 JSON truncate 방지
 * - JSON 파싱 실패 시 1회 재시도
 */
window.JIFC = window.JIFC || {};

JIFC.translator = (() => {
  const BATCH_SIZE = 5;

  const GLOSSARY = `
[교회·예배 용어 — STT가 틀리기 쉬움. 아래처럼 교정]
- 제주 국제순복음교회 / JIFC (국제순복음·순복음교회 표기 유지)
- 수요 기도회 (수여 기도회 X)
- 항존직 (항종직 X), 권사회실 (건사회실·건사 회실 X)
- 피택자, 입교, 세례, 봉헌, 교독, 축도, 아멘
- 치유 (추위 X, 맥락이 병·회복일 때)
- 이른비·늦은비 (이름비 X)
- 열방 (열반 X, 선교·축도 맥락)
- 여짜오되 (여짜오대 X)
- 내일은 (미래는 X, 일정 안내 맥락)
- 찬송/찬양 가사는 가능하면 널리 알려진 가사·운율에 맞게 복원
- 성경 고유명사·구절 번호는 표준 표기 유지
`.trim();

  function buildPrompt(koreanText, targetCodes, opts) {
    const langLines = ["ko: 교정된 한국어", ...targetCodes.map((code) => {
      const meta = JIFC.langByCode[code];
      return `${code}: ${meta ? meta.name : code} 번역`;
    })];

    const schemaKeys = ["ko", ...targetCodes]
      .map((c) => `  "${c}": "..."`)
      .join(",\n");

    const contextBlock = opts.previousContext
      ? `\n[직전 문맥]\n${opts.previousContext}\n`
      : "";

    const koMode = opts.koFixed
      ? `한국어(ko)는 이미 교정된 문장이다. 의미 변경 없이 그대로 ko에 넣고, 지정 언어만 번역하라.`
      : `1) 한국어 STT 오인식·오탈자·띄어쓰기를 예배/설교 문맥에 맞게 교정하라.
2) 분명한 오인식(교회명·예배 용어·성경 표현·찬송 가사)은 고치고, 불확실하면 원문에 가깝게 유지하라.
3) 내용을 요약·삭제·임의 첨삭하지 마라. 미완성 연결어미로 끝나면 억지로 종결하지 마라.
4) 의미 없는 추임새만 있는 입력이면 ko에 빈 문자열 ""을 넣어라.`;

    return `너는 한국 교회 예배(설교·기도·찬송·광고) 동시통역·자막 교정기다.
${koMode}
5) 지정 언어로 자연스럽고 예배에 어울리게 번역하라.
6) JSON 문자열 값 안의 따옴표는 반드시 이스케이프하라.

${GLOSSARY}
${contextBlock}
반드시 아래 JSON 형식으로만 응답 (키: ${langLines.join(", ")}):
{
${schemaKeys}
}

발화 원본: ${JSON.stringify(koreanText)}`;
  }

  function parseJsonSafe(content) {
    if (!content || typeof content !== "string") throw new Error("빈 응답");
    try {
      return JSON.parse(content);
    } catch (_) {
      /* continue */
    }
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch (_) {
        /* continue */
      }
    }
    throw new Error("JSON 파싱 실패");
  }

  async function callOnce(koreanText, targetCodes, opts) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [{ role: "user", content: buildPrompt(koreanText, targetCodes, opts) }],
        response_format: { type: "json_object" },
        temperature: 0.15,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "OpenAI API 오류");
    const content = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";
    return parseJsonSafe(content);
  }

  async function callWithRetry(koreanText, targetCodes, opts) {
    try {
      return await callOnce(koreanText, targetCodes, opts);
    } catch (err) {
      // JSON truncate / 일시 오류 — 1회 재시도
      await new Promise((r) => setTimeout(r, 400));
      return callOnce(koreanText, targetCodes, opts);
    }
  }

  /**
   * @param {string} koreanText
   * @param {{ apiKey: string, model?: string, targetCodes?: string[], previousContext?: string }} opts
   */
  async function translate(koreanText, opts) {
    const apiKey = opts.apiKey;
    if (!apiKey) throw new Error("OpenAI API 키가 없습니다.");

    const model = opts.model || JIFC.config.defaultModel;
    const targetCodes = (opts.targetCodes && opts.targetCodes.length
      ? opts.targetCodes
      : JIFC.targetLangCodes()
    ).filter((c) => c !== "ko");

    const baseOpts = {
      apiKey,
      model,
      previousContext: opts.previousContext || "",
      koFixed: false,
    };

    // 1차: 한국어 교정 + 첫 배치 번역
    const firstBatch = targetCodes.slice(0, BATCH_SIZE);
    const first = await callWithRetry(koreanText, firstBatch, baseOpts);
    const correctedKo = (first.ko != null && String(first.ko).trim())
      ? String(first.ko).trim()
      : koreanText;

    const result = { ...first, ko: correctedKo };

    // 나머지 언어 배치 (교정된 한국어 기준으로 번역만)
    for (let i = BATCH_SIZE; i < targetCodes.length; i += BATCH_SIZE) {
      const batch = targetCodes.slice(i, i + BATCH_SIZE);
      try {
        const part = await callWithRetry(correctedKo, batch, {
          ...baseOpts,
          koFixed: true,
        });
        batch.forEach((code) => {
          if (part[code]) result[code] = part[code];
        });
      } catch (err) {
        // 배치 실패해도 이미 성공한 언어는 유지 (안정성)
        console.warn("translate batch failed", batch, err);
      }
    }

    if (!result.ko) result.ko = koreanText;
    return result;
  }

  return { translate, buildPrompt };
})();
