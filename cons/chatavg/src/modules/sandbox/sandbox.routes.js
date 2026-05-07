/**
 * Routes: Sandbox / Forge API
 * SPEC-019 §7 API Endpoints
 *
 * All routes require authentication. Sandbox operations are admin-visible
 * and logged to the AuditService.
 *
 * POST   /api/sandboxes                    - assign
 * GET    /api/sandboxes/:sandboxId         - getSession
 * POST   /api/sandboxes/:sandboxId/run     - run
 * POST   /api/sandboxes/:sandboxId/snapshot- snapshot
 * POST   /api/sandboxes/:sandboxId/freeze  - freeze
 * POST   /api/sandboxes/:sandboxId/terminate - terminate
 * POST   /api/sandboxes/:sandboxId/quarantine - quarantine
 * DELETE /api/sandboxes/:sandboxId         - cleanup
 */

const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const { asyncHandler } = require('../../core/errors');
const { SANDBOX_FORGE_ENABLED } = require('../../core/config');
const { SandboxManager } = require('./sandbox.manager');
const { AuditService } = require('../audit/audit.service');
const { policyGuard } = require('../policy/policy.guard');

const router = Router();

// Shared manager instance (singleton per process)
const sandboxManager = new SandboxManager({
  enabled: SANDBOX_FORGE_ENABLED,
  auditService: AuditService,
});

// Middleware: reject all calls if feature flag is off
router.use((req, res, next) => {
  if (!SANDBOX_FORGE_ENABLED) {
    return res.status(503).json({
      error: 'SANDBOX_FORGE_DISABLED',
      message: 'Sandbox / Forge feature is not enabled. Set SANDBOX_FORGE_ENABLED=true.',
    });
  }
  next();
});

/**
 * POST /api/sandboxes
 * Assign a new sandbox session.
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { runId, executionClass, workspaceMount, egressPolicy, maxTtlMs, idleTimeoutMs } = req.body;

  if (!runId || !executionClass) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'runId and executionClass are required' });
  }

  const session = await sandboxManager.assign({
    runId,
    executionClass,
    workspaceMount,
    egressPolicy,
    maxTtlMs,
    idleTimeoutMs,
  });

  if (session.skipped) {
    return res.status(200).json(session);
  }

  res.status(201).json({
    sandboxId: session.sandboxId,
    state: session.state,
    adapter: session.adapter,
    executionClass: session.executionClass,
    assignedAt: session.assignedAt,
    maxTtlMs: session.maxTtlMs,
    idleTimeoutMs: session.idleTimeoutMs,
  });
}));

/**
 * GET /api/sandboxes/:sandboxId
 * Get current session state.
 */
router.get('/:sandboxId', authenticate, asyncHandler(async (req, res) => {
  const session = sandboxManager.getSession(req.params.sandboxId);
  if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Sandbox not found' });
  res.json(session);
}));

/**
 * POST /api/sandboxes/:sandboxId/run
 * Execute a command.
 */
router.post('/:sandboxId/run', authenticate, policyGuard('sandbox_operation'), asyncHandler(async (req, res) => {
  const { command, timeoutMs, egressUrls } = req.body;
  req.body.operation = 'run'; // for policy engine

  if (!command) {
    return res.status(400).json({ error: 'MISSING_FIELD', message: 'command is required' });
  }

  const result = await sandboxManager.run(req.params.sandboxId, command, { timeoutMs, egressUrls });
  res.json(result);
}));

/**
 * POST /api/sandboxes/:sandboxId/snapshot
 * Create a filesystem snapshot.
 */
router.post('/:sandboxId/snapshot', authenticate, policyGuard('sandbox_operation'), asyncHandler(async (req, res) => {
  req.body.operation = 'snapshot';
  const result = await sandboxManager.snapshot(req.params.sandboxId);
  res.json(result);
}));

/**
 * POST /api/sandboxes/:sandboxId/freeze
 * Pause execution.
 */
router.post('/:sandboxId/freeze', authenticate, asyncHandler(async (req, res) => {
  const result = await sandboxManager.freeze(req.params.sandboxId);
  res.json(result);
}));

/**
 * POST /api/sandboxes/:sandboxId/terminate
 * Terminate sandbox + extract artifacts.
 */
router.post('/:sandboxId/terminate', authenticate, policyGuard('sandbox_operation'), asyncHandler(async (req, res) => {
  req.body.operation = 'terminate';
  const result = await sandboxManager.terminate(req.params.sandboxId);
  res.json(result);
}));

/**
 * POST /api/sandboxes/:sandboxId/quarantine
 * Lock sandbox; flag for security review.
 */
router.post('/:sandboxId/quarantine', authenticate, policyGuard('sandbox_operation'), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  req.body.operation = 'quarantine';
  const result = await sandboxManager.quarantine(req.params.sandboxId, reason);
  res.json(result);
}));

/**
 * DELETE /api/sandboxes/:sandboxId
 * Cleanup all sandbox resources.
 */
router.delete('/:sandboxId', authenticate, asyncHandler(async (req, res) => {
  const result = await sandboxManager.cleanup(req.params.sandboxId);
  res.json(result);
}));

module.exports = { router, sandboxManager };
