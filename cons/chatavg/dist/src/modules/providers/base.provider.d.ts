export = BaseProvider;
/**
 * Base abstract class for LLM Providers
 * Formalizes the interface for all provider adapters.
 */
declare class BaseProvider {
    /**
     * @param {Object} config
     * @param {string} config.id - Provider unique ID
     * @param {string} config.name - Provider display name
     * @param {string[]} config.models - Supported models
     * @param {string} config.defaultModel - Default model to use
     * @param {Object} [config.capabilities] - Provider capabilities (stream, tools)
     */
    constructor(config: {
        id: string;
        name: string;
        models: string[];
        defaultModel: string;
        capabilities?: Object | undefined;
    });
    id: string;
    name: string;
    models: string[];
    defaultModel: string;
    capabilities: {
        stream: boolean;
        tools: boolean;
    } & Object;
    /**
     * Handle chat completion request. Must be implemented by subclasses.
     * Expected to return an AsyncIterable yielding CanonicalChatEvent:
     * - { type: 'delta', text: string }
     * - { type: 'done', finishReason: string, usage: object }
     * - { type: 'error', message: string, code: string }
     *
     * @param {Array} messages - Chat messages [{role, content}]
     * @param {Object} config  - Category config (api_key, endpoint_url, model_name, etc.)
     * @param {Object} options - Request options (stream, max_tokens)
     * @returns {AsyncIterable<Object>} Async generator yielding chat events
     */
    handleChat(messages: any[], config: Object, options: Object): AsyncIterable<Object>;
    /**
     * Utility to build a standard OpenAI-compatible SSE chunk.
     */
    buildChunk(model: any, text: any, finishReason?: null, toolCalls?: null): {
        id: string;
        object: string;
        created: number;
        model: any;
        choices: {
            index: number;
            delta: {
                tool_calls: any;
                content: any;
            };
            finish_reason: null;
        }[];
    };
    /**
     * Utility to build a standard Chat Completion response object.
     */
    buildResponse(model: any, text: any, usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }, toolCalls?: null): {
        id: string;
        object: string;
        created: number;
        model: any;
        choices: {
            index: number;
            message: {
                role: string;
                content: any;
            };
            finish_reason: string;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    /**
     * Check provider health/availability.
     * Default implementation tries to list models or similar ping.
     * @param {Object} config - Category config
     * @returns {Promise<boolean>}
     */
    checkHealth(config: Object): Promise<boolean>;
    /**
     * Get dynamic list of models available from the provider.
     * Default implementation returns statically configured models.
     * @param {Object} config - Category config
     * @returns {Promise<string[]>}
     */
    getModels(config: Object): Promise<string[]>;
}
