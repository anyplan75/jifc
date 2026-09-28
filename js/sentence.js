/**
 * 한국어 설교 문장 절단 (안정성 우선)
 * - 확실한 종결어미만 적극 절단
 * - 연결어미/길이 절단은 보수적으로
 * - 조사·어간으로 끝나면 절단·flush 보류
 */
window.JIFC = window.JIFC || {};

JIFC.sentence = (() => {
  // 긴 어미를 앞에 둬야 부분일치로 잘리지 않음 (아닙니다 ⊃ 입니다 아님 — 명시 필요)
  const ENDING =
    /(축원합니다|축원하옵나이다|하옵나이다|하겠습니다|하셨습니다|하십니다|바랍니다|할지어다|하시옵소서|하여\s*주옵소서|주옵소서|하옵소서|주시옵소서|나이다|이옵니다|아닙니까|습니까|합니까|인가요|은가요|는가요|잖아요|아닙니다|것입니다|겁니다|입니다|습니다|합니다|합시다|하십시다|십시오|세요|시죠|아멘|네요|어요|아요|예요|대요|지요|군요|죠|느냐|도다|입니까)(\s|[.,?!]|$)/g;

  // 연결어미는 최후 수단 — 짧은 어미(고/며)는 제외해 오절단 감소
  const CLAUSE = /(는데|지만|면서|니까|어서|아서|으니|도록|하며)(\s)/g;

  /** 문장 도중에 끊으면 안 되는 꼬리 (조사·어간·연결) */
  const HANGING_TAIL =
    /(이|가|을|를|은|는|의|에|로|와|과|도|만|께|께서|에서|으로|라고|으며|면서|는데|지만|으니|아서|어서|하며|하고|며|고|제|내|그|저|또|및|좀|더|참|정말|우리|나의|그의|주님|하나님|예수|성령)$/;

  const NOISE =
    /^(네+|예+|음+|어+|아+|으+|그+|저+|응+|오+|어\s*어+|아\s*아+)$/;

  function isHangingTail(text) {
    const t = String(text || "").trim();
    if (!t) return false;
    return HANGING_TAIL.test(t);
  }

  /** API/자막에 올리면 안 되는 잡음·조각 */
  function isNoise(text) {
    const t = String(text || "").trim();
    if (!t) return true;
    if (t.length < 2) return true;
    if (NOISE.test(t)) return true;
    if (/^[ㄱ-ㅎㅏ-ㅣ\s]+$/.test(t)) return true;
    // 같은 음절만 3회 이상 반복 (네네네, 아아아)
    if (/^([가-힣])\1{2,}$/.test(t)) return true;
    return false;
  }

  function findLastEnding(text, minIndex) {
    ENDING.lastIndex = 0;
    let best = null;
    let execResult;
    while ((execResult = ENDING.exec(text)) !== null) {
      if (execResult.index >= minIndex) best = execResult;
    }
    return best;
  }

  function findClauseCut(text) {
    CLAUSE.lastIndex = 0;
    let best = null;
    let execResult;
    while ((execResult = CLAUSE.exec(text)) !== null) {
      // 앞뒤 여유: 너무 앞·너무 끝에서 자르지 않음
      if (execResult.index >= 40 && execResult.index <= text.length - 24) {
        best = execResult;
      }
    }
    return best;
  }

  /**
   * 자를 위치 찾기. 보수적:
   * 1) 종결어미 (가능하면 마지막)
   * 2) 매우 길 때만 연결어미
   * 3) 최후 공백 절단 (조사 꼬리 금지)
   */
  function findCutMatch(text) {
    if (!text || text.length < 12) return null;

    // 짧~중간: 첫 종결어미 (실시간성)
    // 긴 문장: 마지막 종결어미 (한 호흡을 덜 쪼갬)
    const minIdx = 10;
    if (text.length < 100) {
      ENDING.lastIndex = 0;
      let execResult;
      while ((execResult = ENDING.exec(text)) !== null) {
        if (execResult.index >= minIdx) {
          const cutAt = execResult.index + execResult[0].length;
          const piece = text.slice(0, cutAt).trim();
          if (!isHangingTail(piece) && !isNoise(piece)) return execResult;
        }
      }
    } else {
      const last = findLastEnding(text, minIdx);
      if (last) {
        const cutAt = last.index + last[0].length;
        const piece = text.slice(0, cutAt).trim();
        // 너무 짧은 앞조각만 남기면 다음으로 미룸 — 단 140자 넘으면 허용
        const rest = text.slice(cutAt).trim();
        if (!isHangingTail(piece) && !isNoise(piece)) {
          if (rest.length === 0 || rest.length >= 12 || text.length >= 140) return last;
        }
      }
    }

    // 연결어미: 120자 이상일 때만
    if (text.length >= 120) {
      const clause = findClauseCut(text);
      if (clause) {
        const cutAt = clause.index + clause[0].length;
        const piece = text.slice(0, cutAt).trim();
        if (piece.length >= 40 && !isHangingTail(piece)) return clause;
      }
    }

    // 하드 절단: 150자 이상, 공백에서, 조사 꼬리 금지
    if (text.length >= 150) {
      const windowEnd = Math.min(text.length - 20, 140);
      let idx = text.lastIndexOf(" ", windowEnd);
      while (idx > 40) {
        const piece = text.slice(0, idx).trim();
        if (!isHangingTail(piece) && piece.length >= 40) {
          return { index: idx, 0: " ", length: 1 };
        }
        idx = text.lastIndexOf(" ", idx - 1);
      }
    }

    return null;
  }

  function splitReadySentences(unprocessed) {
    const sentences = [];
    let rest = unprocessed;
    let match = findCutMatch(rest);
    let guard = 0;
    while (match && guard++ < 50) {
      const cutIndex = match.index + match[0].length;
      const sentence = rest.substring(0, cutIndex).trim();
      if (sentence && !isNoise(sentence)) sentences.push(sentence);
      rest = rest.substring(cutIndex);
      match = findCutMatch(rest);
    }
    return { sentences, rest };
  }

  /**
   * 침묵 flush 가능 여부
   * - 짧거나 잡음이면 false
   * - 조사 꼬리면 soft 구간에서는 false (force면 true)
   */
  function canSilenceFlush(text, silenceMs, cfg) {
    const t = String(text || "").trim();
    if (!t || isNoise(t)) return false;

    const minChars = (cfg && cfg.minFlushChars) || 8;
    const soft = (cfg && cfg.silenceFlushMs) || 3200;
    const hard = (cfg && cfg.silenceForceFlushMs) || 6500;

    if (silenceMs < soft) return false;
    // 상한 도달 시 길이·조사 꼬리와 무관하게 flush (무한 대기 방지)
    if (silenceMs >= hard) return true;
    if (t.length < minChars) return false;
    if (isHangingTail(t)) return false;
    return true;
  }

  return {
    findCutMatch,
    splitReadySentences,
    isHangingTail,
    isNoise,
    canSilenceFlush,
  };
})();
