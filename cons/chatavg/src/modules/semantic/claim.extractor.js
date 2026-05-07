/**
 * ClaimExtractor — pipeline извлечения утверждений из текста.
 * PoC: rule-based extraction (без внешних NLP-библиотек).
 * @module claim.extractor
 * @see SPEC-005 Claim/DomainBoundary
 */
const crypto = require('crypto');

const STRENGTH_ORDER = ['strong', 'moderate', 'weak', 'hypothesis_only', 'question_only'];

const CLAIM_PATTERNS = [
  {
    patterns: [
      /(?:в тексте|в документе|автор|пользователь)\s+(?:указ|говор|пиш|упомин|отмеч)/i,
      /(?:данные|статистика|исследовани[ея])\s+(?:показыва|свидетельств|подтвержда)/i,
      /(?:согласно|по данным|по результатам)\s/i,
    ],
    type: 'observation',
    defaultStrength: 'strong'
  },
  {
    patterns: [
      /(?:это (?:означает|значит|свидетельствует|указывает))/i,
      /(?:можно (?:интерпретировать|трактовать|понять))/i,
      /(?:таким образом|следовательно|из этого следует)/i,
    ],
    type: 'interpretation',
    defaultStrength: 'moderate'
  },
  {
    patterns: [
      /(?:возможно|вероятно|может быть|предположительно)/i,
      /(?:не исключено|есть основания полагать)/i,
      /(?:perhaps|maybe|possibly|probably|might|could be)/i,
    ],
    type: 'hypothesis',
    defaultStrength: 'weak'
  },
  {
    patterns: [
      /(?:рекомендуется|следует|стоит|необходимо|нужно)/i,
      /(?:should|recommend|suggest|advise|consider)/i,
    ],
    type: 'recommendation',
    defaultStrength: 'moderate'
  },
  {
    patterns: [
      /(?:принято решение|решено|выбрано|утверждено)/i,
      /(?:decided|chosen|approved|selected)/i,
    ],
    type: 'decision',
    defaultStrength: 'strong'
  }
];

const LEVEL_PATTERNS = {
  material: [/(?:факт(?:ически)?|доказано|измерено|вещ(?:еств)?|материал|физическ|объект)/i, /(?:fact|proven|measured|material|physical|object)/i],
  psychic: [/(?:чувств|эмоци|переживан|психи|внутр)/i, /(?:feel|emotion|psychic|inner)/i],
  social: [/(?:обществ|социальн|закон|норм|право)/i, /(?:social|society|law|norm|right)/i],
  linguistic: [/(?:слов|язык|реч|текст)/i, /(?:word|language|speech|text)/i],
  systemic: [/(?:систем|структур|взаимосвяз|целост)/i, /(?:system|structure|relationship|integrity)/i],
  trajectory: [/(?:направлени|последстви|будущ|путь)/i, /(?:direction|consequence|future|trajectory)/i],
  indirect_depth: [/(?:глубин|скрыт|неявн|подтекст)/i, /(?:depth|hidden|implicit|subtext)/i],
};

class ClaimExtractor {
  /**
   * Извлечь claims из текста ответа LLM.
   * @param {string} text - Текст для анализа
   * @param {string} sessionId - ID сессии
   * @param {Object} [options]
   * @param {string[]} [options.sourceRefs] - Ссылки на источники
   * @param {boolean} [options.useLLM] - Использовать ли LLM для экстракции
   * @returns {Object[]} Массив Claims
   */
  async extractClaims(text, sessionId, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return [];

    const useLLM = options.useLLM || process.env.SEMANTIC_LLM_EXTRACTOR_ENABLED === 'true';
    
    if (useLLM) {
      try {
        return await this._extractClaimsLLM(text, sessionId, options);
      } catch (e) {
        console.warn('[Semantic] LLM Extraction failed, falling back to rule-based', e);
      }
    }

    return this._extractClaimsRuleBased(text, sessionId, options);
  }

  /** @private - Rule-based extraction with offset tracking */
  _extractClaimsRuleBased(text, sessionId, options) {
    const claims = [];
    let currentPos = 0;
    
    // Simple sentence splitter that also returns offsets
    const sentenceRegex = /([^.!?;]+[.!? ;]*)/g;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = match[0];
      const trimmed = sentenceText.trim();
      const start = match.index;
      const end = start + sentenceText.length;

      if (trimmed.length < 10) {
        currentPos = end;
        continue;
      }

      const claim = this._analyzeSentence(trimmed, sessionId, {
        ...options,
        sourceSpan: {
          start,
          end,
          confidence: 0.7 // Default rule-based confidence
        }
      });

      if (claim) claims.push(claim);
      currentPos = end;
    }

    return claims;
  }

  /** @private - Mock/Skeleton for LLM extraction */
  async _extractClaimsLLM(text, sessionId, options) {
    // In a real implementation, this would call an LLM with a specific JSON schema prompt.
    // For now, we simulate success or throw to trigger fallback.
    throw new Error('LLM Extractor not implemented yet in v0.2 skeleton');
  }

  /** @private */
  _analyzeSentence(sentence, sessionId, options) {
    let type = 'observation';
    let strength = 'moderate';
    let matched = false;
    for (const pattern of CLAIM_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(sentence)) {
          type = pattern.type;
          strength = pattern.defaultStrength;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched && /[?？]/.test(sentence)) {
      type = 'hypothesis';
      strength = 'question_only';
    }
    const level = this._detectLevel(sentence);
    return {
      claimId: 'claim-' + crypto.randomUUID(),
      sessionId,
      username: options.username || 'system',
      text: sentence,
      type,
      level,
      strength,
      domainBoundaryId: null,
      sourceRefs: options.sourceRefs || [],
      sourceSpan: options.sourceSpan || null,
      downgradedFrom: null,
      downgradedReason: null,
      violations: [],
      requiresUserDecision: false,
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    };
  }

  /** @private */
  _detectLevel(sentence) {
    for (const [level, patterns] of Object.entries(LEVEL_PATTERNS)) {
      for (const regex of patterns) {
        if (regex.test(sentence)) return level;
      }
    }
    return 'unknown';
  }

  static getStrengthOrder(strength) {
    const idx = STRENGTH_ORDER.indexOf(strength);
    return idx === -1 ? STRENGTH_ORDER.length : idx;
  }

  static downgradeStrength(currentStrength, steps = 1) {
    const idx = STRENGTH_ORDER.indexOf(currentStrength);
    if (idx === -1) return 'question_only';
    return STRENGTH_ORDER[Math.min(idx + steps, STRENGTH_ORDER.length - 1)];
  }
}

module.exports = { ClaimExtractor, STRENGTH_ORDER };
