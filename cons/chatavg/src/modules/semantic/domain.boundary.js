/**
 * DomainBoundary — детектор границ области определения и strength downgrade engine.
 * Проверяет claims на нарушение domain boundaries и понижает силу при необходимости.
 * @module domain.boundary
 * @see SPEC-005 Claim/DomainBoundary
 */
const { ClaimExtractor } = require('./claim.extractor');
const SemanticEvents = require('./semantic.events');

/**
 * Предопределённые Domain Boundaries для PoC.
 */
/**
 * Дополнительные уровни реальности v0.2
 */
const REALITY_LEVELS = [
  'material',
  'psychic',
  'social',
  'linguistic',
  'systemic',
  'trajectory',
  'indirect_depth',
  'unknown'
];

/**
 * Новая политика силы утверждений v0.2
 */
const STRENGTH_POLICY = {
  strong: { level: 0, label: 'Strong' },
  moderate: { level: 1, label: 'Moderate' },
  weak: { level: 2, label: 'Weak' },
  hypothesis_only: { level: 3, label: 'Hypothesis Only' },
  question_only: { level: 4, label: 'Question Only' }
};

/**
 * Предопределённые Domain Boundaries v0.2.
 */
const DEFAULT_BOUNDARIES = [
  {
    boundaryId: 'medical',
    name: 'Медицинская область',
    description: 'Медицинские диагнозы и рекомендации',
    level: 'material',
    maxAllowedStrength: 'weak',
    rules: [
      {
        ruleId: 'no_medical_diagnosis',
        name: 'no_medical_diagnosis',
        category: 'downgrade',
        keywords: ['диагноз', 'болезн', 'лечени', 'симптом', 'препарат', 'таблетк', 'инъекц', 'операц', 'хирург', 'diagnosis', 'disease', 'treatment', 'symptom', 'medication', 'prescri', 'surgery'],
        patterns: [/(?:у вас|вам (?:следует|нужно) принимать|ваш диагноз)/i, /(?:you (?:have|should take)|your diagnosis)/i],
        action: { type: 'downgrade', targetStrength: 'weak', message: 'Медицинские утверждения понижены: требуется консультация специалиста' }
      }
    ]
  },
  {
    boundaryId: 'legal',
    name: 'Юридическая область',
    description: 'Юридические заключения и советы',
    level: 'social',
    maxAllowedStrength: 'weak',
    rules: [
      {
        ruleId: 'no_legal_advice',
        name: 'no_legal_advice',
        category: 'downgrade',
        keywords: ['суд', 'закон', 'правов', 'юридическ', 'юридически', 'иск', 'штраф', 'lawsuit', 'legal', 'court', 'statute', 'liability'],
        patterns: [/(?:по закону|юридически|в судебном порядке)/i, /(?:legally|by law|in court)/i],
        action: { type: 'downgrade', targetStrength: 'weak', message: 'Юридические утверждения понижены: требуется консультация юриста' }
      }
    ]
  },
  {
    boundaryId: 'psychological',
    name: 'Психологическая область',
    description: 'Психологические оценки и диагнозы',
    level: 'psychic',
    maxAllowedStrength: 'question_only',
    rules: [
      {
        ruleId: 'no_psychodiagnosis',
        name: 'no_psychodiagnosis',
        category: 'prohibition',
        keywords: ['депресси', 'невроз', 'тревожн', 'расстройств', 'психическ', 'нарцисс', 'психоз', 'биполярн', 'социопат', 'выгоран', 'PTSD', 'depression', 'anxiety', 'disorder', 'narcissis', 'psycholog', 'psychosis', 'bipolar', 'sociopath', 'burnout'],
        patterns: [
          /(?:у вас (?:депрессия|невроз|тревожн|расстройство|биполярн|психоз|выгорание))/i,
          /(?:вы (?:проявляете|демонстрируете|страдаете|находитесь в состоянии))/i,
          /(?:я (?:вижу|диагностирую) у вас)/i,
          /(?:you (?:have|suffer from|exhibit|display|are in) (?:depression|anxiety|disorder|psychosis|burnout))/i,
        ],
        action: { type: 'block', targetStrength: null, message: 'ЗАБЛОКИРОВАНО: Психодиагностика пользователя запрещена' }
      }
    ]
  },
  {
    boundaryId: 'financial',
    name: 'Финансовая область',
    description: 'Инвестиционные и финансовые советы',
    level: 'social',
    maxAllowedStrength: 'weak',
    rules: [
      {
        ruleId: 'no_financial_advice',
        name: 'no_financial_advice',
        category: 'downgrade',
        keywords: ['инвестиц', 'акци', 'биржа', 'криптовалют', 'вложен', 'портфел', 'трейдинг', 'биткоин', 'золот', 'актив', 'invest', 'stock', 'crypto', 'portfolio', 'trading', 'bitcoin', 'gold', 'asset'],
        patterns: [
          /(?:вам (?:следует|стоит|нужно) (?:инвестировать|купить|продать|перевести|вложить))/i,
          /(?:лучшая стратегия (?:сейчас|для вас))/i,
          /(?:you should (?:invest|buy|sell|transfer|allocate))/i,
        ],
        action: { type: 'downgrade', targetStrength: 'weak', message: 'Финансовые рекомендации понижены: не является инвестиционным советом' }
      }
    ]
  },
  {
    boundaryId: 'personal_inner',
    name: 'Внутренний мир человека',
    description: 'Утверждения о чувствах, мотивах, переживаниях',
    level: 'psychic',
    maxAllowedStrength: 'question_only',
    rules: [
      {
        ruleId: 'no_hidden_authority',
        name: 'no_hidden_authority',
        category: 'prohibition',
        keywords: [],
        patterns: [
          /(?:на самом деле вы|в глубине души|ваше (?:подсознание|бессознательное))/i,
          /(?:я (?:понимаю|вижу|чувствую|чую),?\s+что вы)/i,
          /(?:ваши (?:действия|слова|реакции) (?:продиктованы|указывают|свидетельствуют))/i,
          /(?:you (?:actually|really|truly) (?:feel|think|want|need))/i,
          /(?:deep down|your subconscious|I (?:understand|see|sense|feel) that you)/i,
          /(?:your (?:actions|words|reactions) (?:are driven|indicate|show))/i,
        ],
        action: { type: 'block', targetStrength: null, message: 'ЗАБЛОКИРОВАНО: Скрытый авторитет — система не может утверждать о внутреннем мире пользователя' }
      }
    ]
  },
];

class DomainBoundary {
  constructor(boundaries = DEFAULT_BOUNDARIES) {
    this.boundaries = boundaries;
  }

  /**
   * Проверить массив claims на нарушение domain boundaries.
   * @param {Object[]} claims
   * @returns {{ claims: Object[], events: Object[] }}
   */
  enforceBoundaries(claims) {
    const events = [];
    const processed = claims.map(claim => {
      const result = this._checkClaim({ ...claim });
      events.push(...result.events);
      return result.claim;
    });

    const withSourceCheck = processed.map(claim => {
      const result = this._checkMissingSource({ ...claim });
      events.push(...result.events);
      return result.claim;
    });

    return { claims: withSourceCheck, events };
  }

  /** @private */
  _checkClaim(claim) {
    const events = [];
    for (const boundary of this.boundaries) {
      for (const rule of boundary.rules) {
        const triggered = this._isRuleTriggered(claim.text, rule);
        if (!triggered) continue;

        claim.domainBoundaryId = boundary.boundaryId;

        if (rule.action.type === 'block') {
          claim.violations = claim.violations || [];
          claim.violations.push(rule.name);
          claim.requiresUserDecision = true;
          events.push(SemanticEvents.authorityBlocked(claim, rule.name));
          events.push(SemanticEvents.boundaryViolation(claim, boundary.boundaryId, rule.ruleId, 'block'));
        } else if (rule.action.type === 'downgrade') {
          const currentOrder = this._getStrengthLevel(claim.strength);
          const targetOrder = this._getStrengthLevel(rule.action.targetStrength);
          
          if (currentOrder < targetOrder) {
            const fromStrength = claim.strength;
            claim.downgradedFrom = fromStrength;
            claim.strength = rule.action.targetStrength;
            claim.downgradedReason = rule.name;
            events.push(SemanticEvents.claimDowngraded(claim, fromStrength, claim.strength, rule.name));
          }
          events.push(SemanticEvents.boundaryViolation(claim, boundary.boundaryId, rule.ruleId, 'downgrade'));
        }
      }
    }
    return { claim, events };
  }

  /** @private - Check claims with strong strength but no sources */
  _checkMissingSource(claim) {
    const events = [];
    if (this._getStrengthLevel(claim.strength) <= this._getStrengthLevel('strong') && (!claim.sourceRefs || claim.sourceRefs.length === 0)) {
      const fromStrength = claim.strength;
      claim.downgradedFrom = claim.downgradedFrom || fromStrength;
      claim.strength = 'moderate';
      claim.downgradedReason = claim.downgradedReason || 'missing_source';
      events.push(SemanticEvents.claimDowngraded(claim, fromStrength, 'moderate', 'missing_source'));
    }
    return { claim, events };
  }

  /** @private */
  _getStrengthLevel(strength) {
    if (STRENGTH_POLICY[strength]) return STRENGTH_POLICY[strength].level;
    // Map old strengths to new ones for backward compatibility during transition
    const oldMap = {
      'fact': 0,
      'strong_inference': 1,
      'weak_hypothesis': 2,
      'question': 4
    };
    return oldMap[strength] !== undefined ? oldMap[strength] : 99;
  }

  /** @private */
  _isRuleTriggered(text, rule) {
    const lowerText = text.toLowerCase();
    for (const kw of rule.keywords) {
      if (lowerText.includes(kw.toLowerCase())) return true;
    }
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) return true;
    }
    return false;
  }

  getBoundaries() {
    return this.boundaries;
  }
}

module.exports = { DomainBoundary, DEFAULT_BOUNDARIES, REALITY_LEVELS, STRENGTH_POLICY };
