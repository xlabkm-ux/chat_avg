---
id: SPEC-020
title: Semantic Protocol v0.2
version: 0.2.0
owner: Semantic Lead + Backend
status: Draft
last_updated: 2026-05-07
sprint: Sprint R4
---

# SPEC-020: Semantic Protocol v0.2

**Статус:** Draft / Sprint R4  
**Версия:** 0.2.0  
**Дата:** 7 мая 2026  

## 1. Objective

Semantic Protocol v0.2 расширяет базовый PoC (v0.1) до полноценного проверяемого слоя, обеспечивающего:
- Персистентность утверждений (Claims) и событий.
- Поддержку character-level offsets (Source Spans) для трассировки.
- Расширенную типологию уровней реальности (Reality Levels).
- Строгую политику понижения силы утверждений (Strength Policy).
- Гибридную экстракцию (Rule-based + LLM).

## 2. Protocol Specification

### 2.1 Reality Levels (v0.2)
- **material**: Физические факты, измеряемые величины, вещественные объекты.
- **psychic**: Внутренние состояния, чувства, мотивы, когнитивные процессы.
- **social**: Законы, нормы, соглашения, роли, статусы.
- **linguistic**: Текст, синтаксис, семантика высказываний.
- **systemic**: Структуры, связи, эмерджентные свойства систем.
- **trajectory**: Направления развития, последствия, прогнозы.
- **indirect_depth**: Скрытые смыслы, подтекст, имплицитные утверждения.
- **unknown**: Уровень не определен.

### 2.2 Strength Levels (v0.2)
1. **strong**: Факт или прямое наблюдение (требует источника).
2. **moderate**: Обоснованный вывод или сильная интерпретация.
3. **weak**: Гипотеза, предположение, слабая связь.
4. **hypothesis_only**: Чистое предположение без достаточных оснований.
5. **question_only**: Вопрос или проблематизация.

### 2.3 Downgrade Policy
- Если утверждение уровня `strong` не имеет `sourceRefs`, оно автоматически понижается до `moderate`.
- Нарушение Domain Boundary (например, медицинский совет) вызывает понижение до `weak` или блокировку.

## 3. Execution Path

1. **Extraction**:
   - Текст разбивается на сегменты.
   - Фиксируются `start` и `end` смещения в исходном тексте.
   - LLM (если включено) или правила извлекают `text`, `type`, `level`, `strength`.
2. **Enforcement**:
   - `DomainBoundary` проверяет каждый claim на соответствие правилам.
   - При срабатывании правила применяется `action` (downgrade или block).
3. **Persistence**:
   - Claims сохраняются в таблицу `claims`.
   - События (creation, downgrade, violation) сохраняются в `semantic_events`.
4. **Decision Logic**:
   - Если claim помечен `requiresUserDecision=true`, выполнение AgentRun может быть приостановлено для одобрения.

## 4. Data Models

См. [CLAIM_LEDGER_SPEC.md](CLAIM_LEDGER_SPEC.md) для деталей структуры БД.

## 5. Code Examples

### Example 1: Claim Extraction Pipeline

```javascript
// src/services/claimExtractor.service.js
const { v4: uuidv4 } = require('uuid');

class ClaimExtractor {
  constructor(config, domainBoundary, claimLedger) {
    this.config = config;
    this.domainBoundary = domainBoundary;
    this.claimLedger = claimLedger;
    this.llmClient = config.useLLM ? new LLMClient() : null;
  }

  async extract(text, options = {}) {
    const segments = this.segmentText(text);
    const claims = [];

    for (const segment of segments) {
      // Extract claims from segment
      let segmentClaims;

      if (this.llmClient && options.useLLM !== false) {
        segmentClaims = await this.extractWithLLM(segment.text);
      } else {
        segmentClaims = this.extractWithRules(segment.text);
      }

      // Enrich with source spans and metadata
      for (const claim of segmentClaims) {
        claim.id = uuidv4();
        claim.sourceSpans = [{
          text: segment.text,
          start: segment.offset + claim.offset,
          end: segment.offset + claim.offset + claim.text.length,
        }];
        claim.createdAt = new Date().toISOString();

        // Apply domain boundary checks
        const boundaryCheck = await this.domainBoundary.check(claim);
        if (boundaryCheck.violation) {
          claim = this.applyBoundaryAction(claim, boundaryCheck);
        }

        // Apply strength downgrade policy
        claim = this.applyStrengthPolicy(claim);

        claims.push(claim);
      }
    }

    // Persist claims to ledger
    await this.claimLedger.saveBatch(claims);

    console.log(`Extracted ${claims.length} claims from ${segments.length} segments`);
    return claims;
  }

  segmentText(text) {
    // Split text into manageable segments (sentences or paragraphs)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const segments = [];
    let offset = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 0) {
        segments.push({
          text: trimmed,
          offset: text.indexOf(trimmed, offset),
        });
        offset = segments[segments.length - 1].offset + trimmed.length;
      }
    }

    return segments;
  }

  extractWithRules(text) {
    // Rule-based extraction using patterns
    const claims = [];

    // Pattern 1: Factual statements ("X is Y")
    const factualPattern = /(\w+(?:\s+\w+){0,5})\s+(?:is|are|was|were)\s+(.+)/i;
    const factualMatch = text.match(factualPattern);
    if (factualMatch) {
      claims.push({
        text: factualMatch[0],
        subject: factualMatch[1],
        predicate: factualMatch[2],
        type: 'fact',
        level: 'material',
        strength: 'strong',
        offset: text.indexOf(factualMatch[0]),
      });
    }

    // Pattern 2: Causal relationships ("because", "therefore")
    const causalPattern = /(.+)\s+(?:because|therefore|thus|hence)\s+(.+)/i;
    const causalMatch = text.match(causalPattern);
    if (causalMatch) {
      claims.push({
        text: causalMatch[0],
        cause: causalMatch[1],
        effect: causalMatch[2],
        type: 'causal',
        level: 'systemic',
        strength: 'moderate',
        offset: text.indexOf(causalMatch[0]),
      });
    }

    // Pattern 3: Hypotheses ("might", "could", "possibly")
    const hypothesisPattern = /(?:might|could|may|possibly|perhaps)\s+(.+)/i;
    const hypothesisMatch = text.match(hypothesisPattern);
    if (hypothesisMatch) {
      claims.push({
        text: hypothesisMatch[0],
        content: hypothesisMatch[1],
        type: 'hypothesis',
        level: 'trajectory',
        strength: 'weak',
        offset: text.indexOf(hypothesisMatch[0]),
      });
    }

    return claims;
  }

  async extractWithLLM(text) {
    // Use LLM for sophisticated claim extraction
    const prompt = `
Extract all claims from the following text. For each claim, identify:
- The claim text
- Type (fact, opinion, hypothesis, question)
- Reality level (material, psychic, social, linguistic, systemic, trajectory, indirect_depth)
- Strength (strong, moderate, weak, hypothesis_only, question_only)

Text: "${text}"

Return as JSON array.`;

    const response = await this.llmClient.generate(prompt);
    
    try {
      const claims = JSON.parse(response.text);
      return claims.map(claim => ({
        ...claim,
        offset: text.indexOf(claim.text),
      }));
    } catch (error) {
      console.error('Failed to parse LLM extraction:', error);
      return this.extractWithRules(text); // Fallback to rule-based
    }
  }

  applyStrengthPolicy(claim) {
    // Downgrade strong claims without source references
    if (claim.strength === 'strong' && (!claim.sourceRefs || claim.sourceRefs.length === 0)) {
      claim.strength = 'moderate';
      claim.downgraded = true;
      claim.downgradeReason = 'Missing source reference';
    }

    return claim;
  }

  applyBoundaryAction(claim, boundaryCheck) {
    switch (boundaryCheck.action) {
      case 'downgrade':
        claim.strength = this.downgradeStrength(claim.strength);
        claim.boundaryViolation = true;
        claim.boundaryRule = boundaryCheck.rule;
        break;
      case 'block':
        claim.blocked = true;
        claim.blockReason = boundaryCheck.reason;
        break;
    }

    return claim;
  }

  downgradeStrength(strength) {
    const hierarchy = ['strong', 'moderate', 'weak', 'hypothesis_only', 'question_only'];
    const currentIndex = hierarchy.indexOf(strength);
    const newIndex = Math.min(currentIndex + 1, hierarchy.length - 1);
    return hierarchy[newIndex];
  }
}

module.exports = ClaimExtractor;
```

### Example 2: Domain Boundary Enforcement

```javascript
// src/policies/domainBoundary.policy.js
class DomainBoundary {
  constructor(rules = []) {
    this.rules = rules || this.getDefaultRules();
  }

  getDefaultRules() {
    return [
      {
        id: 'medical-advice',
        domain: 'medical',
        pattern: /\b(diagnose|treatment|prescription|symptom|disease)\b/i,
        action: 'downgrade',
        targetStrength: 'weak',
        reason: 'Medical advice requires professional verification',
      },
      {
        id: 'legal-advice',
        domain: 'legal',
        pattern: /\b(lawsuit|attorney|court|verdict|liable)\b/i,
        action: 'downgrade',
        targetStrength: 'moderate',
        reason: 'Legal information is not legal advice',
      },
      {
        id: 'financial-advice',
        domain: 'financial',
        pattern: /\b(invest|stock|crypto|profit|guaranteed\s+return)\b/i,
        action: 'block',
        reason: 'Financial advice is prohibited',
      },
    ];
  }

  async check(claim) {
    for (const rule of this.rules) {
      if (rule.pattern.test(claim.text)) {
        return {
          violation: true,
          rule: rule.id,
          domain: rule.domain,
          action: rule.action,
          reason: rule.reason,
          targetStrength: rule.targetStrength,
        };
      }
    }

    return { violation: false };
  }

  getViolations(claims) {
    return claims.filter(claim => claim.boundaryViolation || claim.blocked);
  }
}

module.exports = DomainBoundary;
```

### Example 3: Semantic Event Tracking

```javascript
// src/models/semanticEvent.model.js
class SemanticEvent {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.type = data.type; // 'claim.created', 'claim.downgraded', 'claim.blocked', 'boundary.violation'
    this.claimId = data.claimId;
    this.missionId = data.missionId;
    this.runId = data.runId;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  static createClaimCreated(claim, missionId, runId) {
    return new SemanticEvent({
      type: 'claim.created',
      claimId: claim.id,
      missionId,
      runId,
      metadata: {
        strength: claim.strength,
        level: claim.level,
        type: claim.type,
      },
    });
  }

  static createClaimDowngraded(claim, reason, previousStrength) {
    return new SemanticEvent({
      type: 'claim.downgraded',
      claimId: claim.id,
      missionId: claim.missionId,
      runId: claim.runId,
      metadata: {
        reason,
        previousStrength,
        newStrength: claim.strength,
      },
    });
  }

  static createBoundaryViolation(claim, rule, action) {
    return new SemanticEvent({
      type: 'boundary.violation',
      claimId: claim.id,
      missionId: claim.missionId,
      runId: claim.runId,
      metadata: {
        rule,
        action,
        domain: claim.domain,
      },
    });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      claimId: this.claimId,
      missionId: this.missionId,
      runId: this.runId,
      timestamp: this.timestamp,
      metadata: this.metadata,
    };
  }
}

module.exports = SemanticEvent;
```

### Example 4: Protocol Version Management

```javascript
// src/services/semanticProtocol.service.js
class SemanticProtocolService {
  constructor() {
    this.versions = new Map();
    this.registerVersion('0.1.0', this.getProtocolV01());
    this.registerVersion('0.2.0', this.getProtocolV02());
    this.currentVersion = '0.2.0';
  }

  registerVersion(version, protocol) {
    this.versions.set(version, protocol);
    console.log(`Registered Semantic Protocol v${version}`);
  }

  getProtocol(version) {
    const protocol = this.versions.get(version);
    if (!protocol) {
      throw new Error(`Semantic Protocol version not found: ${version}`);
    }
    return protocol;
  }

  getProtocolV02() {
    return {
      version: '0.2.0',
      realityLevels: [
        'material',
        'psychic',
        'social',
        'linguistic',
        'systemic',
        'trajectory',
        'indirect_depth',
        'unknown',
      ],
      strengthLevels: [
        'strong',
        'moderate',
        'weak',
        'hypothesis_only',
        'question_only',
      ],
      policies: {
        downgradeWithoutSource: true,
        enforceDomainBoundary: true,
        requireUserDecisionForBlocked: true,
      },
    };
  }

  validateClaim(claim, protocolVersion = this.currentVersion) {
    const protocol = this.getProtocol(protocolVersion);

    const errors = [];

    // Validate reality level
    if (!protocol.realityLevels.includes(claim.level)) {
      errors.push(`Invalid reality level: ${claim.level}`);
    }

    // Validate strength
    if (!protocol.strengthLevels.includes(claim.strength)) {
      errors.push(`Invalid strength level: ${claim.strength}`);
    }

    // Validate required fields
    if (!claim.text) {
      errors.push('Claim text is required');
    }

    if (!claim.type) {
      errors.push('Claim type is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  migrateClaim(claim, fromVersion, toVersion) {
    // Handle breaking changes between versions
    if (fromVersion === '0.1.0' && toVersion === '0.2.0') {
      // v0.1 didn't have sourceSpans
      if (!claim.sourceSpans) {
        claim.sourceSpans = [];
      }

      // v0.1 had different strength levels
      if (claim.strength === 'certain') {
        claim.strength = 'strong';
      } else if (claim.strength === 'uncertain') {
        claim.strength = 'weak';
      }
    }

    return claim;
  }
}

module.exports = SemanticProtocolService;
```

### Example 5: Integration with AgentRun Workflow

```javascript
// src/workflows/agentWorkflow.semantic.js
async function processSemanticLayer(agentRun, message) {
  const { runId, missionId, userId } = agentRun;

  // Get semantic protocol for this mission
  const mission = await missionService.getMission(missionId);
  const protocolVersion = mission.semanticProtocolId || '0.2.0';

  // Extract claims from user message
  const claims = await claimExtractor.extract(message.content, {
    useLLM: true,
  });

  // Track semantic events
  for (const claim of claims) {
    claim.missionId = missionId;
    claim.runId = runId;

    const event = SemanticEvent.createClaimCreated(claim, missionId, runId);
    await semanticEventRepository.save(event);

    // Check if claim requires user decision
    if (claim.blocked || claim.requiresUserDecision) {
      // Pause workflow and request approval
      await workflow.condition(() =>
        workflow.signalReceived('approve_claim') ||
        workflow.signalReceived('reject_claim')
      );
    }
  }

  // Evaluate if claims change the mission trajectory
  const trajectoryClaims = claims.filter(c => c.level === 'trajectory');
  if (trajectoryClaims.length > 0) {
    await updateMissionOpenQuestions(missionId, trajectoryClaims);
  }

  return {
    claims,
    violations: claims.filter(c => c.boundaryViolation || c.blocked),
    requiresApproval: claims.some(c => c.requiresUserDecision),
  };
}

async function updateMissionOpenQuestions(missionId, trajectoryClaims) {
  const mission = await missionService.getMission(missionId);

  // Add new questions based on trajectory claims
  const newQuestions = trajectoryClaims.map(claim =>
    `How does "${claim.text}" affect our goal?`
  );

  mission.openQuestions = [
    ...mission.openQuestions,
    ...newQuestions.filter(q => !mission.openQuestions.includes(q)),
  ];

  await missionService.updateMission(missionId, mission);
}
```
