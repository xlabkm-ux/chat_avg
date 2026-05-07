/**
 * ClaimExtractor — pipeline извлечения утверждений из текста.
 * PoC: rule-based extraction (без внешних NLP-библиотек).
 * @module claim.extractor
 * @see SPEC-005 Claim/DomainBoundary
 */
const crypto = require('crypto');

const STRENGTH_ORDER = ['fact', 'strong_inference', 'weak_hypothesis', 'question'];

const CLAIM_PATTERNS = [
  {
    patterns: [
      /(?:в тексте|в документе|автор|пользователь)\s+(?:указ|говор|пиш|упомин|отмеч)/i,
      /(?:данные|статистика|исследовани[ея])\s+(?:показыва|свидетельств|подтвержда)/i,
      /(?:согласно|по данным|по результатам)\s/i,
    ],
    type: 'observation',
    defaultStrength: 'fact'
  },
  {
    patterns: [
      /(?:это (?:означает|значит|свидетельствует|указывает))/i,
      /(?:можно (?:интерпретировать|трактовать|понять))/i,
      /(?:таким образом|следовательно|из этого следует)/i,
    ],
    type: 'interpretation',
    defaultStrength: 'strong_inference'
  },
  {
    patterns: [
      /(?:возможно|вероятно|может быть|предположительно)/i,
      /(?:не исключено|есть основания полагать)/i,
      /(?:perhaps|maybe|possibly|probably|might|could be)/i,
    ],
    type: 'hypothesis',
    defaultStrength: 'weak_hypothesis'
  },
  {
    patterns: [
      /(?:рекомендуется|следует|стоит|необходимо|нужно)/i,
      /(?:should|recommend|suggest|advise|consider)/i,
    ],
    type: 'recommendation',
    defaultStrength: 'strong_inference'
  },
  {
    patterns: [
      /(?:принято решение|решено|выбрано|утверждено)/i,
      /(?:decided|chosen|approved|selected)/i,
    ],
    type: 'decision',
    defaultStrength: 'fact'
  }
];

const LEVEL_PATTERNS = {
  fact: [/(?:факт(?:ически)?|доказано|измерено)/i, /(?:fact|proven|measured)/i],
  model: [/(?:модел[ьи]|теори[яи]|концепци[яи])/i, /(?:model|theory|framework)/i],
  value: [/(?:ценност[ьи]|важно|приоритет|принцип)/i, /(?:value|important|priority)/i],
  trajectory: [/(?:направлени[ея]|последстви[яе]|будущ)/i, /(?:direction|consequence|future)/i],
  system: [/(?:систем[аы]|структур[аы]|взаимосвяз)/i, /(?:system|structure|relationship)/i],
};

class ClaimExtractor {
  /**
   * Извлечь claims из текста ответа LLM.
   * @param {string} text - Текст для анализа
   * @param {string} sessionId - ID сессии
   * @param {Object} [options]
   * @param {string[]} [options.sourceRefs] - Ссылки на источники
   * @returns {Object[]} Массив Claims
   */
  extractClaims(text, sessionId, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return [];
    const sentences = this._splitIntoSentences(text);
    const claims = [];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) continue;
      const claim = this._analyzeSentence(trimmed, sessionId, options);
      if (claim) claims.push(claim);
    }
    return claims;
  }

  /** @private */
  _analyzeSentence(sentence, sessionId, options) {
    let type = 'observation';
    let strength = 'strong_inference';
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
      strength = 'question';
    }
    const level = this._detectLevel(sentence);
    return {
      claimId: 'claim-' + crypto.randomUUID(),
      sessionId,
      text: sentence,
      type,
      level,
      strength,
      domainBoundaryId: null,
      sourceRefs: options.sourceRefs || [],
      downgradedFrom: null,
      downgradedReason: null,
      violations: [],
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
    return 'text';
  }

  /** @private */
  _splitIntoSentences(text) {
    const raw = text.replace(/\n{2,}/g, '\n')
      .split(/(?<=[.!?;])\s+(?=[A-ZА-ЯЁ])|(?<=\n)(?=[-•*\d])/);
    return raw.map(s => s.replace(/^[-•*\d.)\s]+/, '').trim()).filter(s => s.length >= 10);
  }

  static getStrengthOrder(strength) {
    const idx = STRENGTH_ORDER.indexOf(strength);
    return idx === -1 ? STRENGTH_ORDER.length : idx;
  }

  static downgradeStrength(currentStrength, steps = 1) {
    const idx = STRENGTH_ORDER.indexOf(currentStrength);
    if (idx === -1) return 'question';
    return STRENGTH_ORDER[Math.min(idx + steps, STRENGTH_ORDER.length - 1)];
  }
}

module.exports = { ClaimExtractor, STRENGTH_ORDER };
