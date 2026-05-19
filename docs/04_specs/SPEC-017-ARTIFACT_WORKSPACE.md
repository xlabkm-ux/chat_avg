---
id: SPEC-017
title: Artifact Workspace
version: 1.0.0
owner: Core Team
status: Draft
last_updated: 2026-05-07
sprint: Sprint 10
---

# SPEC-017: Artifact Workspace

## 1. Overview
The Artifact Workspace is the primary collaborative environment where agents and users co-create versioned documents ("Artifacts") backed by semantic evidence and decision logs.

## 2. Core Entities

### 2.1 Artifact
- `id`: Unique identifier (UUID).
- `type`: `code`, `document`, `plan`, `specification`.
- `title`: Human-readable title.
- `content`: Current full state of the artifact.
- `version`: Sequential version number.
- `claims`: Array of semantic claims derived from this artifact.

### 2.2 ArtifactPatch
- `artifactId`: Parent artifact.
- `diff`: Standard unified diff or JSON-patch.
- `reason`: Justification for the change.
- `decisionId`: Link to the `DecisionRecord` that authorized this patch.

### 2.3 DecisionRecord
- `id`: Unique identifier.
- `title`: Decision title.
- `outcome`: `approved`, `rejected`, `deferred`.
- `logic`: Rationale behind the decision.
- `missionId`: Associated mission.

## 3. Storage Policy
- Artifacts are stored in the SQLite `artifacts` table.
- Large content blocks may be offloaded to external blob storage with a local pointer.

## 4. Integrity Rules
- Every `ArtifactPatch` must be linked to a `DecisionRecord`.
- Every `DecisionRecord` must be linked to a `Mission`.
- Claims must be re-extracted upon every new version (patch application).

## 5. Code Examples

### Example 1: Artifact CRUD Operations

```javascript
// src/services/artifact.service.js
const { v4: uuidv4 } = require('uuid');
const diff = require('diff');

class ArtifactService {
  constructor(artifactRepository, claimExtractor) {
    this.repository = artifactRepository;
    this.claimExtractor = claimExtractor;
  }

  async createArtifact(userId, missionId, data) {
    const artifact = {
      id: uuidv4(),
      userId,
      missionId,
      type: data.type, // 'code', 'document', 'plan', 'specification'
      title: data.title,
      content: data.content || '',
      version: 1,
      claims: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Extract initial claims from content
    artifact.claims = await this.extractClaims(artifact.content);

    await this.repository.save(artifact);

    console.log(`Artifact created: ${artifact.id} (v${artifact.version})`);
    return artifact;
  }

  async getArtifact(artifactId) {
    const artifact = await this.repository.findById(artifactId);

    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    return artifact;
  }

  async updateArtifact(artifactId, newContent, reason) {
    const artifact = await this.getArtifact(artifactId);

    // Generate diff
    const patch = diff.createPatch(
      artifact.title,
      artifact.content,
      newContent,
      'previous version',
      'new version'
    );

    // Create decision record for this change
    const decisionRecord = await this.createDecisionRecord({
      artifactId,
      missionId: artifact.missionId,
      title: `Update ${artifact.title}`,
      outcome: 'approved',
      logic: reason,
    });

    // Apply update
    artifact.content = newContent;
    artifact.version += 1;
    artifact.updatedAt = new Date().toISOString();

    // Re-extract claims
    artifact.claims = await this.extractClaims(newContent);

    // Save artifact
    await this.repository.save(artifact);

    // Record the patch
    await this.recordPatch({
      artifactId,
      diff: patch,
      reason,
      decisionId: decisionRecord.id,
      versionFrom: artifact.version - 1,
      versionTo: artifact.version,
    });

    console.log(`Artifact updated: ${artifactId} (v${artifact.version})`);
    return artifact;
  }

  async deleteArtifact(artifactId, userId) {
    const artifact = await this.getArtifact(artifactId);

    // Authorization check
    if (artifact.userId !== userId) {
      throw new Error('Unauthorized: cannot delete other users artifacts');
    }

    await this.repository.delete(artifactId);
    console.log(`Artifact deleted: ${artifactId}`);
  }

  async extractClaims(content) {
    // Use semantic protocol to extract claims (see SPEC-004)
    const claims = await this.claimExtractor.extract(content);
    return claims.map(claim => ({
      claimId: claim.id,
      text: claim.text,
      confidence: claim.confidence,
      domainBoundary: claim.domainBoundary,
    }));
  }

  async createDecisionRecord(data) {
    const decisionRecord = {
      id: uuidv4(),
      artifactId: data.artifactId,
      missionId: data.missionId,
      title: data.title,
      outcome: data.outcome,
      logic: data.logic,
      createdAt: new Date().toISOString(),
    };

    await this.decisionRepository.save(decisionRecord);
    return decisionRecord;
  }

  async recordPatch(data) {
    const patch = {
      id: uuidv4(),
      artifactId: data.artifactId,
      diff: data.diff,
      reason: data.reason,
      decisionId: data.decisionId,
      versionFrom: data.versionFrom,
      versionTo: data.versionTo,
      createdAt: new Date().toISOString(),
    };

    await this.patchRepository.save(patch);
    return patch;
  }
}

module.exports = ArtifactService;
```

### Example 2: Version Management and History

```javascript
// src/services/artifact.version.service.js
class ArtifactVersionService {
  async getVersionHistory(artifactId) {
    const patches = await this.patchRepository.findByArtifactId(artifactId, {
      orderBy: 'versionFrom',
      order: 'ASC',
    });

    return patches.map(patch => ({
      versionFrom: patch.versionFrom,
      versionTo: patch.versionTo,
      diff: patch.diff,
      reason: patch.reason,
      decisionId: patch.decisionId,
      timestamp: patch.createdAt,
    }));
  }

  async revertToVersion(artifactId, targetVersion, userId) {
    const artifact = await this.artifactService.getArtifact(artifactId);

    if (targetVersion >= artifact.version) {
      throw new Error(`Target version ${targetVersion} is not older than current version ${artifact.version}`);
    }

    // Get all patches up to target version
    const patches = await this.patchRepository.findByArtifactId(artifactId);
    const relevantPatches = patches.filter(p => p.versionTo <= targetVersion);

    if (relevantPatches.length === 0) {
      throw new Error('No patches found to reconstruct version');
    }

    // Reconstruct content by applying patches in reverse
    let reconstructedContent = artifact.content;
    for (let i = patches.length - 1; i >= relevantPatches.length; i--) {
      const patch = patches[i];
      reconstructedContent = diff.applyPatch(reconstructedContent, patch.diff, true);
    }

    // Create new version with reverted content
    const updatedArtifact = await this.artifactService.updateArtifact(
      artifactId,
      reconstructedContent,
      `Reverted to version ${targetVersion}`
    );

    return updatedArtifact;
  }

  async compareVersions(artifactId, version1, version2) {
    const patches = await this.patchRepository.findByArtifactId(artifactId);

    const v1Patch = patches.find(p => p.versionTo === version1);
    const v2Patch = patches.find(p => p.versionTo === version2);

    if (!v1Patch || !v2Patch) {
      throw new Error('One or both versions not found');
    }

    return {
      version1: {
        version: version1,
        diff: v1Patch.diff,
        timestamp: v1Patch.createdAt,
      },
      version2: {
        version: version2,
        diff: v2Patch.diff,
        timestamp: v2Patch.createdAt,
      },
    };
  }
}

module.exports = ArtifactVersionService;
```

### Example 3: Storage Adapter Pattern

```javascript
// src/adapters/artifactStorage.adapter.js
const fs = require('fs').promises;
const path = require('path');

class ArtifactStorageAdapter {
  constructor(config) {
    this.storageType = config.storageType || 'local'; // 'local', 's3', 'gcs'
    this.localPath = config.localPath || './data/artifacts';
    this.maxInlineSize = config.maxInlineSize || 100 * 1024; // 100KB
  }

  async store(artifactId, content) {
    const contentSize = Buffer.byteLength(content, 'utf-8');

    if (contentSize <= this.maxInlineSize) {
      // Store inline (in database)
      return {
        storageType: 'inline',
        content,
        size: contentSize,
      };
    } else {
      // Offload to external storage
      const filePath = await this.storeExternal(artifactId, content);
      return {
        storageType: this.storageType,
        path: filePath,
        size: contentSize,
      };
    }
  }

  async retrieve(storageRef) {
    if (storageRef.storageType === 'inline') {
      return storageRef.content;
    } else {
      return await this.retrieveExternal(storageRef.path);
    }
  }

  async storeExternal(artifactId, content) {
    const fileName = `${artifactId}.txt`;
    const filePath = path.join(this.localPath, fileName);

    // Ensure directory exists
    await fs.mkdir(this.localPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, 'utf-8');

    console.log(`Stored artifact externally: ${filePath}`);
    return filePath;
  }

  async retrieveExternal(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to retrieve artifact from ${filePath}: ${error.message}`);
    }
  }

  async cleanup(artifactId, storageRef) {
    if (storageRef.storageType !== 'inline') {
      try {
        await fs.unlink(storageRef.path);
        console.log(`Cleaned up external artifact: ${storageRef.path}`);
      } catch (error) {
        console.error(`Failed to cleanup ${storageRef.path}: ${error.message}`);
      }
    }
  }
}

module.exports = ArtifactStorageAdapter;
```

### Example 4: Integrity Validation

```javascript
// src/services/artifact.integrity.service.js
class ArtifactIntegrityService {
  async validateArtifactIntegrity(artifactId) {
    const artifact = await this.artifactRepository.findById(artifactId);

    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const violations = [];

    // Check 1: All patches have decision records
    const patches = await this.patchRepository.findByArtifactId(artifactId);
    for (const patch of patches) {
      if (!patch.decisionId) {
        violations.push({
          type: 'MISSING_DECISION_RECORD',
          patchId: patch.id,
          message: `Patch ${patch.id} has no associated decision record`,
        });
      } else {
        const decision = await this.decisionRepository.findById(patch.decisionId);
        if (!decision) {
          violations.push({
            type: 'INVALID_DECISION_REFERENCE',
            patchId: patch.id,
            decisionId: patch.decisionId,
            message: `Decision record ${patch.decisionId} not found`,
          });
        }
      }
    }

    // Check 2: All decision records are linked to a mission
    const decisions = await this.decisionRepository.findByArtifactId(artifactId);
    for (const decision of decisions) {
      if (!decision.missionId) {
        violations.push({
          type: 'MISSING_MISSION_LINK',
          decisionId: decision.id,
          message: `Decision ${decision.id} is not linked to a mission`,
        });
      }
    }

    // Check 3: Claims are up-to-date with current version
    const currentClaims = await this.claimExtractor.extract(artifact.content);
    const storedClaimIds = artifact.claims.map(c => c.claimId).sort();
    const currentClaimIds = currentClaims.map(c => c.id).sort();

    if (JSON.stringify(storedClaimIds) !== JSON.stringify(currentClaimIds)) {
      violations.push({
        type: 'STALE_CLAIMS',
        message: 'Claims need re-extraction for current version',
        storedCount: storedClaimIds.length,
        currentCount: currentClaimIds.length,
      });
    }

    // Check 4: Version sequence is continuous
    const versions = patches.map(p => p.versionTo).sort((a, b) => a - b);
    for (let i = 0; i < versions.length; i++) {
      if (versions[i] !== i + 1) {
        violations.push({
          type: 'VERSION_GAP',
          expectedVersion: i + 1,
          actualVersion: versions[i],
          message: `Version gap detected: expected v${i + 1}, found v${versions[i]}`,
        });
        break;
      }
    }

    return {
      artifactId,
      isValid: violations.length === 0,
      violations,
      checkedAt: new Date().toISOString(),
    };
  }

  async repairArtifact(artifactId) {
    const validation = await this.validateArtifactIntegrity(artifactId);

    if (validation.isValid) {
      return { repaired: false, reason: 'Artifact is already valid' };
    }

    const repairs = [];

    // Repair stale claims
    const hasStaleClaims = validation.violations.some(v => v.type === 'STALE_CLAIMS');
    if (hasStaleClaims) {
      const artifact = await this.artifactRepository.findById(artifactId);
      const newClaims = await this.claimExtractor.extract(artifact.content);
      artifact.claims = newClaims.map(claim => ({
        claimId: claim.id,
        text: claim.text,
        confidence: claim.confidence,
      }));
      artifact.updatedAt = new Date().toISOString();
      await this.artifactRepository.save(artifact);
      repairs.push('CLAIMS_REEXTRACTED');
    }

    return {
      repaired: true,
      repairs,
      remainingViolations: validation.violations.filter(
        v => v.type !== 'STALE_CLAIMS'
      ),
    };
  }
}

module.exports = ArtifactIntegrityService;
```

### Example 5: Collaborative Editing with Locks

```javascript
// src/services/artifact.collaboration.service.js
class ArtifactCollaborationService {
  constructor() {
    this.locks = new Map(); // artifactId -> { userId, lockedAt, expiresAt }
    this.LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  }

  async acquireLock(artifactId, userId) {
    // Check existing lock
    const existingLock = this.locks.get(artifactId);

    if (existingLock) {
      // Check if lock is expired
      if (Date.now() > existingLock.expiresAt) {
        console.log(`Lock expired for artifact ${artifactId}`);
        this.locks.delete(artifactId);
      } else if (existingLock.userId !== userId) {
        throw new Error(
          `Artifact is locked by user ${existingLock.userId}. ` +
          `Lock expires at ${new Date(existingLock.expiresAt).toISOString()}`
        );
      }
    }

    // Acquire lock
    const lock = {
      userId,
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.LOCK_TIMEOUT_MS).toISOString(),
    };

    this.locks.set(artifactId, lock);

    console.log(`Lock acquired: ${artifactId} by ${userId}`);
    return lock;
  }

  async releaseLock(artifactId, userId) {
    const lock = this.locks.get(artifactId);

    if (!lock) {
      throw new Error(`No lock found for artifact ${artifactId}`);
    }

    if (lock.userId !== userId) {
      throw new Error(`Cannot release lock owned by ${lock.userId}`);
    }

    this.locks.delete(artifactId);
    console.log(`Lock released: ${artifactId} by ${userId}`);
  }

  async extendLock(artifactId, userId) {
    const lock = this.locks.get(artifactId);

    if (!lock || lock.userId !== userId) {
      throw new Error('Lock not found or not owned by user');
    }

    lock.expiresAt = new Date(Date.now() + this.LOCK_TIMEOUT_MS).toISOString();
    this.locks.set(artifactId, lock);

    return lock;
  }

  getLockStatus(artifactId) {
    const lock = this.locks.get(artifactId);

    if (!lock) {
      return { locked: false };
    }

    return {
      locked: true,
      userId: lock.userId,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      remainingSeconds: Math.round((new Date(lock.expiresAt) - Date.now()) / 1000),
    };
  }

  // Cleanup expired locks periodically
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [artifactId, lock] of this.locks.entries()) {
        if (now > new Date(lock.expiresAt)) {
          console.log(`Cleaning up expired lock: ${artifactId}`);
          this.locks.delete(artifactId);
        }
      }
    }, 60 * 1000); // Check every minute
  }
}

module.exports = ArtifactCollaborationService;
```
