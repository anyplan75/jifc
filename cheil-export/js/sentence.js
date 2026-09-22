/**
 * 한국어 설교 문장 절단
 * 종결어미 우선 → 연결어미 → 길이 기반 안전 절단
 */
window.JIFC = window.JIFC || {};

JIFC.sentence = (() => {
  const ENDING =
    /(습니다|합니다|하십니다|바랍니다|축원합니다|할지어다|아멘|하옵소서|나이다|옵소서|이옵니다|습니까|합니까|인가요|은가요|는가요|네요|어요|아요|예요|대요|지요|군요|죠|거늘|시니|느냐|도다|입니까|입니다|잖아요)(\s|[.,?!]|$)/g;

  const CLAUSE = /(고|며|는데|지만|면서|니까|어서|아서|으니|도록|하며|하고)(\s)/g;

  function findCutMatch(text) {
    let execResult;
    ENDING.lastIndex = 0;
    while ((execResult = ENDING.exec(text)) !== null) {
      if (execResult.index >= 10) return execResult;
    }

    if (text.length >= 60) {
      CLAUSE.lastIndex = 0;
      let match = null;
      while ((execResult = CLAUSE.exec(text)) !== null) {
        if (execResult.index >= 20) {
          match = execResult;
          if (execResult.index > 70) break;
        }
      }
      if (match) return match;

      if (text.length >= 90) {
        const lastSpace = text.lastIndexOf(" ", 85);
        if (lastSpace > 20) return { index: lastSpace, 0: " ", length: 1 };
        return { index: 90, 0: "", length: 0 };
      }
    }

    return null;
  }

  /** unprocessed 텍스트에서 자를 수 있는 문장들을 모두 분리 */
  function splitReadySentences(unprocessed) {
    const sentences = [];
    let rest = unprocessed;
    let match = findCutMatch(rest);
    while (match) {
      const cutIndex = match.index + match[0].length;
      const sentence = rest.substring(0, cutIndex).trim();
      if (sentence) sentences.push(sentence);
      rest = rest.substring(cutIndex);
      match = findCutMatch(rest);
    }
    return { sentences, rest };
  }

  return { findCutMatch, splitReadySentences };
})();
