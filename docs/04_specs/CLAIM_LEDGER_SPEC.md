---
id: SPEC-021
title: Claim Ledger and Persistence Spec
version: 1.0.0
owner: Semantic Lead + Backend
status: Draft
last_updated: 2026-05-07
sprint: Sprint R4
---

# SPEC-021: Claim Ledger and Persistence Spec

**Статус:** Draft / Sprint R4  
**Версия:** 1.0  
**Дата:** 7 мая 2026  

## 1. Overview

Claim Ledger — это централизованный реестр всех семантических единиц (Claims), извлеченных и обработанных в системе ChatAVG. В v0.2 реестр переведен с in-memory хранилища на SQLite для обеспечения долговечности (durability) и возможности аудита.

## 2. Database Schema

### 2.1 Table: `claims`
| Field | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | Уникальный ID утверждения (UUID). |
| `session_id` | TEXT | ID сессии (FK). |
| `username` | TEXT | Владелец сессии. |
| `claim_text` | TEXT | Текст самого утверждения. |
| `claim_type` | TEXT | observation, interpretation, hypothesis, recommendation, decision. |
| `reality_level` | TEXT | material, psychic, social, linguistic, systemic, trajectory, unknown. |
| `strength` | TEXT | strong, moderate, weak, hypothesis_only, question_only. |
| `evidence_basis` | TEXT | Обоснование утверждения (текст или ссылка). |
| `source_refs` | TEXT (JSON) | Массив ссылок на внешние источники или KnowledgeGateway chunks. |
| `source_span` | TEXT (JSON) | Смещения в тексте: `{start, end, confidence, messageId, artifactVersion}`. |
| `domain_boundary_id` | TEXT | Ссылка на нарушенную границу. |
| `allowed_strength` | TEXT | Максимально допустимая сила для данной границы. |
| `downgraded_from` | TEXT | Исходная сила до понижения. |
| `distortion_risks` | TEXT (JSON) | Обнаруженные когнитивные искажения или риски подмены. |
| `requires_user_decision` | BOOLEAN | Требует ли утверждение вмешательства пользователя. |
| `created_at` | INTEGER | Timestamp создания. |

### 2.2 Table: `semantic_events`
Логирует все изменения состояния семантического слоя.
| Field | Type | Description |
|---|---|---|
| `id` | TEXT (PK) | UUID. |
| `session_id` | TEXT | ID сессии. |
| `username` | TEXT | Пользователь. |
| `run_id` | TEXT | ID AgentRun (если применимо). |
| `event_type` | TEXT | claim.created, claim.downgraded, authority.blocked, boundary.violation. |
| `claim_id` | TEXT | Ссылка на claim. |
| `payload` | TEXT (JSON) | Контекст события. |
| `created_at` | INTEGER | Timestamp. |

## 3. Repository API

Интерфейс `SemanticRepository` предоставляет следующие методы:
- `saveClaim(claim)`: Сохранение или обновление.
- `saveClaims(claims)`: Пакетное сохранение.
- `getClaimsBySession(sessionId, username)`: Выборка истории.
- `logEvent(event)`: Запись в лог.
- `getSummary(sessionId, username)`: Агрегированная статистика (counts by type, strength).
- `clearSession(sessionId)`: Очистка данных.

## 4. Code Examples

### Example 1: ClaimLedger Repository Implementation

```javascript
// src/repositories/claimLedger.repository.js
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

class ClaimLedgerRepository {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const createClaimsTable = `
      CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        username TEXT NOT NULL,
        claim_text TEXT NOT NULL,
        claim_type TEXT NOT NULL,
        reality_level TEXT NOT NULL,
        strength TEXT NOT NULL,
        evidence_basis TEXT,
        source_refs TEXT,
        source_span TEXT,
        domain_boundary_id TEXT,
        allowed_strength TEXT,
        downgraded_from TEXT,
        distortion_risks TEXT,
        requires_user_decision BOOLEAN DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS semantic_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        username TEXT NOT NULL,
        run_id TEXT,
        event_type TEXT NOT NULL,
        claim_id TEXT,
        payload TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    await this.runQuery(createClaimsTable);
    await this.runQuery(createEventsTable);

    console.log('Claim Ledger tables initialized');
  }

  async saveClaim(claim) {
    const sql = `
      INSERT OR REPLACE INTO claims (
        id, session_id, username, claim_text, claim_type,
        reality_level, strength, evidence_basis, source_refs,
        source_span, domain_boundary_id, allowed_strength,
        downgraded_from, distortion_risks, requires_user_decision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      claim.id || uuidv4(),
      claim.sessionId,
      claim.username,
      claim.claimText,
      claim.claimType,
      claim.realityLevel,
      claim.strength,
      claim.evidenceBasis || null,
      claim.sourceRefs ? JSON.stringify(claim.sourceRefs) : null,
      claim.sourceSpan ? JSON.stringify(claim.sourceSpan) : null,
      claim.domainBoundaryId || null,
      claim.allowedStrength || null,
      claim.downgradedFrom || null,
      claim.distortionRisks ? JSON.stringify(claim.distortionRisks) : null,
      claim.requiresUserDecision ? 1 : 0,
    ];

    await this.runQuery(sql, params);
    return claim.id;
  }

  async saveClaims(claims) {
    // Use transaction for batch insert
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        let error = null;
        for (const claim of claims) {
          this.saveClaim(claim).catch(err => {
            error = err;
          });
        }

        if (error) {
          this.db.run('ROLLBACK');
          reject(error);
        } else {
          this.db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(claims.length);
          });
        }
      });
    });
  }

  async getClaimsBySession(sessionId, username, options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const filterType = options.type;

    let sql = `
      SELECT * FROM claims
      WHERE session_id = ? AND username = ?
    `;

    const params = [sessionId, username];

    if (filterType) {
      sql += ' AND claim_type = ?';
      params.push(filterType);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return this.allQuery(sql, params);
  }

  async logEvent(event) {
    const sql = `
      INSERT INTO semantic_events (
        id, session_id, username, run_id, event_type,
        claim_id, payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      event.id || uuidv4(),
      event.sessionId,
      event.username,
      event.runId || null,
      event.eventType,
      event.claimId || null,
      JSON.stringify(event.payload),
    ];

    await this.runQuery(sql, params);
    return event.id;
  }

  async getSummary(sessionId, username) {
    const sql = `
      SELECT
        COUNT(*) as total_claims,
        claim_type,
        reality_level,
        strength,
        COUNT(DISTINCT CASE WHEN requires_user_decision = 1 THEN id END) as pending_decisions
      FROM claims
      WHERE session_id = ? AND username = ?
      GROUP BY claim_type, reality_level, strength
    `;

    const rows = await this.allQuery(sql, [sessionId, username]);

    // Aggregate results
    const summary = {
      totalClaims: 0,
      byType: {},
      byRealityLevel: {},
      byStrength: {},
      pendingDecisions: 0,
    };

    for (const row of rows) {
      summary.totalClaims += row.total_claims;
      summary.pendingDecisions += row.pending_decisions;

      if (!summary.byType[row.claim_type]) {
        summary.byType[row.claim_type] = 0;
      }
      summary.byType[row.claim_type] += row.total_claims;

      if (!summary.byRealityLevel[row.reality_level]) {
        summary.byRealityLevel[row.reality_level] = 0;
      }
      summary.byRealityLevel[row.reality_level] += row.total_claims;

      if (!summary.byStrength[row.strength]) {
        summary.byStrength[row.strength] = 0;
      }
      summary.byStrength[row.strength] += row.total_claims;
    }

    return summary;
  }

  async clearSession(sessionId, username) {
    const deleteClaims = 'DELETE FROM claims WHERE session_id = ? AND username = ?';
    const deleteEvents = 'DELETE FROM semantic_events WHERE session_id = ? AND username = ?';

    await this.runQuery(deleteClaims, [sessionId, username]);
    await this.runQuery(deleteEvents, [sessionId, username]);

    console.log(`Cleared session ${sessionId} for user ${username}`);
  }

  // Helper methods
  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = ClaimLedgerRepository;
```

### Example 2: Query and Filter Operations

```javascript
// src/services/claimQuery.service.js
class ClaimQueryService {
  constructor(repository) {
    this.repository = repository;
  }

  async getClaimsByRealityLevel(sessionId, username, level) {
    const claims = await this.repository.getClaimsBySession(sessionId, username);
    return claims.filter(c => c.reality_level === level);
  }

  async getHighStrengthClaims(sessionId, username, minStrength = 'strong') {
    const strengthOrder = ['strong', 'moderate', 'weak', 'hypothesis_only', 'question_only'];
    const minIndex = strengthOrder.indexOf(minStrength);

    const claims = await this.repository.getClaimsBySession(sessionId, username);
    
    return claims.filter(claim => {
      const claimIndex = strengthOrder.indexOf(claim.strength);
      return claimIndex <= minIndex; // Lower index = higher strength
    });
  }

  async getClaimsWithViolations(sessionId, username) {
    const claims = await this.repository.getClaimsBySession(sessionId, username);
    
    return claims.filter(claim => 
      claim.domain_boundary_id || 
      claim.downgraded_from ||
      (claim.distortion_risks && JSON.parse(claim.distortion_risks).length > 0)
    );
  }

  async getClaimsRequiringDecision(sessionId, username) {
    const sql = `
      SELECT * FROM claims
      WHERE session_id = ? AND username = ? AND requires_user_decision = 1
      ORDER BY created_at DESC
    `;

    return this.repository.allQuery(sql, [sessionId, username]);
  }

  async searchClaims(sessionId, username, searchText) {
    const sql = `
      SELECT * FROM claims
      WHERE session_id = ? AND username = ?
      AND claim_text LIKE ?
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return this.repository.allQuery(sql, [
      sessionId,
      username,
      `%${searchText}%`,
    ]);
  }

  async getClaimTimeline(sessionId, username) {
    const sql = `
      SELECT
        c.*,
        se.event_type,
        se.created_at as event_time
      FROM claims c
      LEFT JOIN semantic_events se ON c.id = se.claim_id
      WHERE c.session_id = ? AND c.username = ?
      ORDER BY c.created_at ASC, se.created_at ASC
    `;

    const rows = await this.repository.allQuery(sql, [sessionId, username]);

    // Group by claim
    const timeline = {};
    for (const row of rows) {
      if (!timeline[row.id]) {
        timeline[row.id] = {
          claim: row,
          events: [],
        };
      }

      if (row.event_type) {
        timeline[row.id].events.push({
          type: row.event_type,
          timestamp: row.event_time,
        });
      }
    }

    return Object.values(timeline);
  }

  async exportClaims(sessionId, username, format = 'json') {
    const claims = await this.repository.getClaimsBySession(sessionId, username);

    if (format === 'json') {
      return JSON.stringify(claims, null, 2);
    } else if (format === 'csv') {
      const headers = Object.keys(claims[0] || {});
      const csvRows = [
        headers.join(','),
        ...claims.map(claim =>
          headers.map(h => {
            const value = claim[h];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',')
        ),
      ];
      return csvRows.join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

module.exports = ClaimQueryService;
```

### Example 3: Claim Lifecycle Management

```javascript
// src/services/claimLifecycle.service.js
class ClaimLifecycleService {
  constructor(ledgerRepository, eventRepository) {
    this.ledger = ledgerRepository;
    this.events = eventRepository;
  }

  async createClaim(sessionId, username, claimData) {
    const claim = {
      id: claimData.id,
      sessionId,
      username,
      claimText: claimData.text,
      claimType: claimData.type,
      realityLevel: claimData.level,
      strength: claimData.strength,
      evidenceBasis: claimData.evidence,
      sourceRefs: claimData.sources,
      sourceSpan: claimData.span,
      requiresUserDecision: claimData.requiresDecision || false,
    };

    // Save claim
    await this.ledger.saveClaim(claim);

    // Log creation event
    await this.events.logEvent({
      sessionId,
      username,
      eventType: 'claim.created',
      claimId: claim.id,
      payload: {
        type: claim.claimType,
        level: claim.realityLevel,
        strength: claim.strength,
      },
    });

    console.log(`Claim created: ${claim.id}`);
    return claim;
  }

  async downgradeClaim(sessionId, username, claimId, reason, newStrength) {
    const claim = await this.getClaim(claimId);

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const previousStrength = claim.strength;
    claim.strength = newStrength;
    claim.downgradedFrom = previousStrength;

    // Update claim
    await this.ledger.saveClaim(claim);

    // Log downgrade event
    await this.events.logEvent({
      sessionId,
      username,
      eventType: 'claim.downgraded',
      claimId,
      payload: {
        reason,
        previousStrength,
        newStrength,
      },
    });

    console.log(`Claim downgraded: ${claimId} (${previousStrength} → ${newStrength})`);
    return claim;
  }

  async markDecisionMade(sessionId, username, claimId, decision) {
    const claim = await this.getClaim(claimId);

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    claim.requiresUserDecision = false;
    claim.decision = decision; // 'approved' or 'rejected'
    claim.decidedAt = new Date().toISOString();

    await this.ledger.saveClaim(claim);

    await this.events.logEvent({
      sessionId,
      username,
      eventType: 'claim.decision_made',
      claimId,
      payload: {
        decision,
      },
    });

    return claim;
  }

  async archiveClaim(sessionId, username, claimId, reason) {
    const claim = await this.getClaim(claimId);

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    claim.archived = true;
    claim.archiveReason = reason;
    claim.archivedAt = new Date().toISOString();

    await this.ledger.saveClaim(claim);

    await this.events.logEvent({
      sessionId,
      username,
      eventType: 'claim.archived',
      claimId,
      payload: {
        reason,
      },
    });

    return claim;
  }

  async getClaim(claimId) {
    const sql = 'SELECT * FROM claims WHERE id = ?';
    const rows = await this.ledger.allQuery(sql, [claimId]);
    return rows[0] || null;
  }
}

module.exports = ClaimLifecycleService;
```

### Example 4: Audit and Compliance Queries

```javascript
// src/services/claimAudit.service.js
class ClaimAuditService {
  constructor(ledgerRepository) {
    this.ledger = ledgerRepository;
  }

  async getSessionAuditTrail(sessionId, username) {
    const sql = `
      SELECT
        se.*,
        c.claim_text,
        c.claim_type,
        c.strength
      FROM semantic_events se
      LEFT JOIN claims c ON se.claim_id = c.id
      WHERE se.session_id = ? AND se.username = ?
      ORDER BY se.created_at ASC
    `;

    return this.ledger.allQuery(sql, [sessionId, username]);
  }

  async getComplianceReport(username, dateRange) {
    const { startDate, endDate } = dateRange;

    const sql = `
      SELECT
        COUNT(*) as total_claims,
        SUM(CASE WHEN requires_user_decision = 1 THEN 1 ELSE 0 END) as decisions_required,
        SUM(CASE WHEN domain_boundary_id IS NOT NULL THEN 1 ELSE 0 END) as boundary_violations,
        SUM(CASE WHEN downgraded_from IS NOT NULL THEN 1 ELSE 0 END) as downgrades,
        claim_type,
        reality_level
      FROM claims
      WHERE username = ?
      AND created_at BETWEEN ? AND ?
      GROUP BY claim_type, reality_level
    `;

    return this.ledger.allQuery(sql, [
      username,
      startDate.getTime() / 1000,
      endDate.getTime() / 1000,
    ]);
  }

  async detectAnomalies(sessionId, username) {
    const claims = await this.ledger.getClaimsBySession(sessionId, username);

    const anomalies = [];

    // Check 1: High percentage of downgraded claims
    const downgradedCount = claims.filter(c => c.downgraded_from).length;
    const downgradeRate = downgradedCount / claims.length;

    if (downgradeRate > 0.5) {
      anomalies.push({
        type: 'HIGH_DOWNGRADE_RATE',
        severity: 'warning',
        message: `${Math.round(downgradeRate * 100)}% of claims were downgraded`,
        threshold: '50%',
      });
    }

    // Check 2: Many claims requiring decisions
    const decisionCount = claims.filter(c => c.requires_user_decision).length;
    if (decisionCount > 10) {
      anomalies.push({
        type: 'EXCESSIVE_DECISIONS',
        severity: 'info',
        message: `${decisionCount} claims require user decisions`,
      });
    }

    // Check 3: Boundary violations
    const violations = claims.filter(c => c.domain_boundary_id);
    if (violations.length > 0) {
      anomalies.push({
        type: 'BOUNDARY_VIOLATIONS',
        severity: 'critical',
        message: `${violations.length} boundary violations detected`,
        violations: violations.map(v => ({
          claimId: v.id,
          boundary: v.domain_boundary_id,
        })),
      });
    }

    return {
      sessionId,
      username,
      totalClaims: claims.length,
      anomalies,
      checkedAt: new Date().toISOString(),
    };
  }

  async generateRetentionReport(username) {
    const sql = `
      SELECT
        DATE(created_at, 'unixepoch') as date,
        COUNT(*) as claim_count
      FROM claims
      WHERE username = ?
      GROUP BY DATE(created_at, 'unixepoch')
      ORDER BY date DESC
      LIMIT 30
    `;

    return this.ledger.allQuery(sql, [username]);
  }
}

module.exports = ClaimAuditService;
```
