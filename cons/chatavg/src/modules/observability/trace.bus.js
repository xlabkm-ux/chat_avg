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
    
    // For specific observability overlays we can emit sub-events
    if (metadata.error) {
      this.emit('error', trace);
    }
  }

  getRecentTraces(limit = 100) {
    return this.traces.slice(-limit);
  }

  clear() {
    this.traces = [];
  }
}

module.exports = new TraceBus();
