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

  async createRun(missionId, metadata = {}) {
    const mission = missionRepository.findById(missionId);
    if (!mission) throw new Error('Mission not found');

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

    return run;
  }

  async inMemoryExecution(runId, missionId) {
    await this.updateState(runId, 'running');
    await new Promise(r => setTimeout(r, 1000));
    await this.updateState(runId, 'requires_action', { step: 'model' });
    await new Promise(r => setTimeout(r, 1000));
    await this.updateState(runId, 'completed');
  }

  async getRun(runId) {
    const run = runRepository.findById(runId);
    if (!run) return null;
    return run;
  }

  async cancelRun(runId, reason = 'User cancelled') {
    const run = runRepository.findById(runId);
    if (!run) throw new Error('Run not found');

    if (['completed', 'failed', 'cancelled', 'expired'].includes(run.state)) {
      return run; // Already in a terminal state
    }

    if (TEMPORAL_RUNTIME_ENABLED && run.state === 'waiting') {
      try {
        await temporalClient.signalApproval(runId, 'cancel');
      } catch(err) {
        console.error('Failed to signal Temporal workflow', err);
      }
    }

    return this.updateState(runId, 'cancelled', {}, reason);
  }

  async updateState(runId, newState, metadata = {}, reason = null) {
    const currentRun = runRepository.findById(runId);
    if (!currentRun) throw new Error('Run not found');

    const previousState = currentRun.state;
    if (previousState === newState) return currentRun;

    const updatedRun = runRepository.updateState(runId, newState, metadata);

    this.emitEvent(runId, 'run.status_changed', {
      previousState,
      currentState: newState,
      reason
    });

    return updatedRun;
  }

  emitEvent(runId, type, payload) {
    const event = {
      runId,
      eventId: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      payload
    };

    // Emit locally for SSE streams
    this.emit(`event:${runId}`, event);
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
