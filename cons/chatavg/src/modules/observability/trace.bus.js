const { EventEmitter } = require('events');

class TraceBus extends EventEmitter {
  constructor() {
    super();
    this.traces = [];
    this.MAX_TRACES = 1000;
  }

  /**
   * Emit a trace event.
   * @param {string} source Component source (e.g., 'ChatService', 'KnowledgeGateway')
   * @param {string} action Action being traced
   * @param {object} metadata Additional metadata including latency, cost, etc.
   */
  emitTrace(source, action, metadata = {}) {
    const trace = {
      timestamp: new Date().toISOString(),
      source,
      action,
      ...metadata
    };
    
    this.traces.push(trace);
    if (this.traces.length > this.MAX_TRACES) {
      this.traces.shift();
    }

    this.emit('trace', trace);
    
    // Sub-events can be added here if needed, but must be handled to avoid ERR_UNHANDLED_ERROR
  }

  getRecentTraces(limit = 100) {
    return this.traces.slice(-limit);
  }

  clear() {
    this.traces = [];
  }
}

module.exports = new TraceBus();
