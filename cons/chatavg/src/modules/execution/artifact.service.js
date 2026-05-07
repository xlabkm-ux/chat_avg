
const { v4: uuidv4 } = require('uuid');
const roleRegistry = require('./role_pass');

/**
 * ArtifactService — manages versioned artifacts and patches.
 */
class ArtifactService {
  constructor() {
    this.artifacts = new Map();
    this.patches = [];
  }

  /**
   * Creates a new artifact.
   * @param {string} roleId
   * @param {Object} data { type, title, content }
   * @returns {Object}
   */
  createArtifact(roleId, data) {
    roleRegistry.verifyPass(roleId, 'builder');

    const artifact = {
      id: uuidv4(),
      type: data.type || 'document',
      title: data.title || 'Untitled Artifact',
      content: data.content || '',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      claims: []
    };

    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  /**
   * Applies a patch to an artifact.
   * @param {string} roleId
   * @param {string} artifactId 
   * @param {Object} patch { diff, reason, decisionId }
   * @returns {Object}
   */
  applyPatch(roleId, artifactId, patch) {
    roleRegistry.verifyPass(roleId, 'builder');

    const artifact = this.artifacts.get(artifactId);
    if (!artifact) throw new Error('Artifact not found');

    // In a real system, we would apply the diff. 
    // For PoC, we replace the content or append the "patch".
    artifact.content += `\n[Patch v${artifact.version + 1}]: ${patch.diff}`;
    artifact.version += 1;
    artifact.updatedAt = new Date();

    const patchRecord = {
      id: uuidv4(),
      artifactId,
      ...patch,
      appliedAt: new Date(),
      version: artifact.version
    };

    this.patches.push(patchRecord);
    return artifact;
  }

  /**
   * Get artifact by ID.
   */
  getArtifact(id) {
    return this.artifacts.get(id);
  }

  /**
   * List all artifacts in a session (simplified).
   */
  listArtifacts() {
    return Array.from(this.artifacts.values());
  }
}

module.exports = new ArtifactService();
