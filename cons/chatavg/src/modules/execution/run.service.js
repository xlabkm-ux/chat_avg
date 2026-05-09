const EventEmitter = require('events');
const runRepository = require('./run.repository');
const missionRepository = require('../mission/mission.repository');
const { v4: uuidv4 } = require('uuid');
const temporalClient = require('../temporal/client');
const { TEMPORAL_RUNTIME_ENABLED } = require('../../core/config');

class AgentRunService extends EventEmitter {
  constructor() {
    super();
    this.activeStreams = new Map(); // runId -> Set of res objects
  }

  async createRun(missionId, metadata = {}, username, idempotencyKey = null) {
    if (idempotencyKey) {
      const existing = runRepository.getIdempotencyKey(idempotencyKey);
      if (existing) return existing.responseBody;
    }

    const mission = missionRepository.findById(missionId, username);
    if (!mission) throw new Error('Mission not found or unauthorized');

    const run = runRepository.create({
      missionId,
      state: 'queued',
      metadata
    });

    this.emitEvent(run.id, 'run.status_changed', {
      previousState: null,
      currentState: 'queued'
    });

    if (TEMPORAL_RUNTIME_ENABLED) {
      temporalClient.startAgentRun(run.id, missionId).catch(console.error);
    } else {
      this.inMemoryExecution(run.id, missionId).catch(console.error);
    }

    if (idempotencyKey) {
      runRepository.saveIdempotencyKey(idempotencyKey, 201, run);
    }

    return run;
  }

  async inMemoryExecution(runId, missionId) {
    await this.updateState(runId, 'running');
    await new Promise(r => setTimeout(r, 1000));
    await this.updateState(runId, 'requires_action', { step: 'model' });
    await new Promise(r => setTimeout(r, 1000));
    await this.updateState(runId, 'running', { step: 'finalizing' });
    await this.updateState(runId, 'completed');
  }

  async getRun(runId, username) {
    const run = runRepository.findById(runId, username);
    if (!run) return null;
    return run;
  }

  async cancelRun(runId, reason = 'User cancelled', username) {
    const run = runRepository.findById(runId, username);
    if (!run) throw new Error('Run not found or unauthorized');

    const terminalStates = ['completed', 'failed', 'cancelled', 'expired'];
    if (terminalStates.includes(run.state)) {
      return run; // Already in a terminal state
    }

    // Signal Temporal if active
    if (TEMPORAL_RUNTIME_ENABLED) {
      try {
        await temporalClient.signalApproval(runId, 'cancel');
      } catch(err) {
        // If workflow is not found, it might be already finished or in dev mode
        console.warn(`Failed to signal Temporal workflow for run ${runId}:`, err.message);
      }
    }

    return this.updateState(runId, 'cancelled', {}, reason, username);
  }

  async updateState(runId, newState, metadata = {}, reason = null, username) {
    const currentRun = runRepository.findById(runId, username);
    if (!currentRun) throw new Error('Run not found or unauthorized');

    const previousState = currentRun.state;
    if (previousState === newState) return currentRun;

    const updatedRun = runRepository.updateState(runId, newState, metadata, username);

    this.emitEvent(runId, 'run.status_changed', {
      previousState,
      currentState: newState,
      reason
    });

    return updatedRun;
  }

  emitEvent(runId, type, payload) {
    const event = runRepository.createEvent(runId, type, payload);

    // Emit locally for SSE streams
    this.emit(`event:${runId}`, {
      runId: event.runId,
      eventId: event.id,
      timestamp: new Date(event.createdAt).toISOString(),
      type: event.eventType,
      payload: event.payload
    });
  }

  addStream(runId, res) {
    if (!this.activeStreams.has(runId)) {
      this.activeStreams.set(runId, new Set());
    }
    this.activeStreams.get(runId).add(res);

    const listener = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    this.on(`event:${runId}`, listener);

    res.on('close', () => {
      this.removeListener(`event:${runId}`, listener);
      const streams = this.activeStreams.get(runId);
      if (streams) {
        streams.delete(res);
        if (streams.size === 0) {
          this.activeStreams.delete(runId);
        }
      }
    });
  }
}

module.exports = new AgentRunService();
