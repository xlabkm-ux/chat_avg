"use strict";
/**
 * @typedef {Object} CanonicalChatEvent
 * @property {'delta' | 'tool_call' | 'done' | 'error'} type
 * @property {string} [text] - For 'delta' events
 * @property {Object} [toolCall] - For 'tool_call' events
 * @property {string} [finishReason] - For 'done' events
 * @property {Object} [usage] - For 'done' events
 * @property {string} [message] - For 'error' events
 * @property {string} [code] - For 'error' events
 */
const ProviderEvents = {
    /** @returns {CanonicalChatEvent} */
    delta: (text) => ({ type: 'delta', text }),
    /** @returns {CanonicalChatEvent} */
    toolCall: (toolCall) => ({ type: 'tool_call', toolCall }),
    /** @returns {CanonicalChatEvent} */
    done: (finishReason = 'stop', usage = null) => ({ type: 'done', finishReason, usage }),
    /** @returns {CanonicalChatEvent} */
    error: (message, code = 'provider_error') => ({ type: 'error', message, code })
};
module.exports = ProviderEvents;
//# sourceMappingURL=providerEvents.js.map