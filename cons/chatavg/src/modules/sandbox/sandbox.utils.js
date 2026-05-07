const crypto = require('crypto');

const MAX_OUTPUT_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ARTIFACTS = 20;

// Quarantine: MIME types that are immediately suspicious
const BLOCKED_MIME_TYPES = new Set([
  'application/x-executable',
  'application/x-elf',
  'application/x-mach-binary',
  'application/x-msdownload',
]);

/**
 * Scans artifacts for suspicious content and applies size limits.
 * @param {Array} rawArtifacts - Raw artifacts from adapter.
 * @returns {{ artifacts: Array, quarantined: boolean }}
 */
function scanArtifacts(rawArtifacts) {
  if (!Array.isArray(rawArtifacts) || rawArtifacts.length === 0) {
    return { artifacts: [], quarantined: false };
  }

  const artifacts = rawArtifacts.slice(0, MAX_ARTIFACTS).map(a => {
    const suspiciousMime = BLOCKED_MIME_TYPES.has(a.mimeType);
    const oversized = (a.sizeBytes || 0) > MAX_OUTPUT_BYTES;
    return {
      artifactId: a.artifactId || crypto.randomBytes(6).toString('hex'),
      name: a.name || 'unknown',
      mimeType: a.mimeType || 'application/octet-stream',
      sizeBytes: a.sizeBytes || 0,
      contentHash: a.contentHash || '',
      clean: !suspiciousMime && !oversized,
    };
  });

  const quarantined = artifacts.some(a => !a.clean);
  return { artifacts, quarantined };
}

/**
 * Estimates the cost of a sandbox session.
 * @param {Object} session - The sandbox session.
 * @returns {Object} Cost estimation object.
 */
function estimateCost(session) {
  const elapsedMs = session.terminatedAt
    ? new Date(session.terminatedAt).getTime() - new Date(session.assignedAt).getTime()
    : Date.now() - new Date(session.assignedAt).getTime();
  
  return {
    cpuMs: elapsedMs,
    memoryMbMs: 0,     // Adapter-reported in production
    egressBytes: 0,    // Audit-tracked in production
    estimatedUsd: parseFloat((elapsedMs / 1000 * 0.00005).toFixed(6)), // ~$0.05/CPU-hour placeholder
  };
}

module.exports = {
  scanArtifacts,
  estimateCost,
  MAX_OUTPUT_BYTES,
  MAX_ARTIFACTS,
  BLOCKED_MIME_TYPES,
};
