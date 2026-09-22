/**
 * OpenAI 기반 교정·번역
 * - 관리자에서 켠 언어만 번역 → 토큰·지연 절감
 * - JSON 응답 강제
 */
window.JIFC = window.JIFC || {};

JIFC.translator = (() => {
  function buildPrompt(koreanText, targetCodes) {
    const langLines = ["ko: 교정된 한국어", ...targetCodes.map((code) => {
      const meta = JIFC.langByCode[code];
      return `${code}: ${meta ? meta.name : code} 번역`;
    })];

    const schemaKeys = ["ko", ...targetCodes]
      .map((c) => `  "${c}": "..."`)
      .join(",\n");

    return `너는 기독교 예배 설교를 전담하는 최고 수준의 동시통역사야.
다음 목사님의 설교 발화를 읽고:
1) 한국어 오탈자와 띄어쓰기를 문맥에 맞게 다듬어 교정해.
2) 지정된 언어로 자연스럽고 영적인 울림이 있도록 번역해.
3) [원문 사수] 원문에 있는 단어를 임의로 빼거나 삭제하지 말고 모두 포함해.
4) [요약 및 중략 절대 금지] 내용을 임의로 요약하거나 생략하지 마.
5) [미완성 어미 보존] 원문이 '~고', '~는데', '~서', '~며' 등의 연결어미나 미완성 상태로 끝났다면, 억지로 '~습니다', '~합니다'로 문장을 닫지 말고 원문 그대로 살려둬.

반드시 아래 JSON 형식으로만 응답해 (키: ${langLines.join(", ")}):
{
${schemaKeys}
}

발화 원본: ${JSON.stringify(koreanText)}`;
  }

  /**
   * @param {string} koreanText
   * @param {{ apiKey: string, model?: string, targetCodes?: string[] }} opts
   */
  async function translate(koreanText, opts) {
    const apiKey = opts.apiKey;
    if (!apiKey) throw new Error("OpenAI API 키가 없습니다.");

    const model = opts.model || JIFC.config.defaultModel;
    const targetCodes = (opts.targetCodes && opts.targetCodes.length
      ? opts.targetCodes
      : JIFC.targetLangCodes()
    ).filter((c) => c !== "ko");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildPrompt(koreanText, targetCodes) }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "OpenAI API 오류");

    const result = JSON.parse(data.choices[0].message.content);
    if (!result.ko) result.ko = koreanText;
    return result;
  }

  return { translate, buildPrompt };
})();
