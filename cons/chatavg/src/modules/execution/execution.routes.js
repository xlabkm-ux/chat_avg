const express = require('express');
const router = express.Router();
const runService = require('./run.service');
const { AGENT_RUNS_ENABLED } = require('../../core/config');

// Middleware to check if Agent Runs are enabled
router.use((req, res, next) => {
  if (!AGENT_RUNS_ENABLED) {
    return res.status(403).json({ error: 'Agent Runs are currently disabled' });
  }
  next();
});

/**
 * POST /api/runs
 * Create a new Agent Run for a Mission
 */
router.post('/', async (req, res) => {
  try {
    const { missionId, metadata } = req.body;
    if (!missionId) {
      return res.status(400).json({ error: 'missionId is required' });
    }

    const run = await runService.createRun(missionId, metadata);
    res.status(201).json(run);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/runs/:id
 * Get status of an Agent Run
 */
router.get('/:id', async (req, res) => {
  try {
    const run = await runService.getRun(req.params.id);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/runs/:id/cancel
 * Cancel an active Agent Run
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const run = await runService.cancelRun(req.params.id, reason);
    res.json(run);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/runs/:id/events
 * SSE stream for Agent Run events
 */
router.get('/:id/events', async (req, res) => {
  const runId = req.params.id;
  
  // Verify run exists
  const run = await runService.getRun(runId);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state event
  const initialEvent = {
    runId,
    eventId: 'initial',
    timestamp: new Date().toISOString(),
    type: 'run.status_changed',
    payload: {
      previousState: null,
      currentState: run.state,
      reason: 'Initial stream connection'
    }
  };
  res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

  // Add client to service streams
  runService.addStream(runId, res);
});

module.exports = router;
