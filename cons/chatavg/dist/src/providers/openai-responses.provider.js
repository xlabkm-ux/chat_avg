"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIResponsesProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_js_1 = require("./base.js");
class OpenAIResponsesProvider extends base_js_1.BaseProvider {
    defaultBaseUrl;
    constructor(config) {
        super({
            ...config,
            capabilities: {
                stream: true,
                tools: true,
                ...config.capabilities
            }
        });
        this.defaultBaseUrl = config.defaultBaseUrl;
    }
    _convertMessages(messages) {
        let instructions = '';
        const input = [];
        for (const msg of messages) {
            if (msg.role === 'system') {
                instructions += (instructions ? '\n' : '') + msg.content;
            }
            else if (msg.role === 'user') {
                input.push({
                    role: 'user',
                    content: [{ type: 'input_text', text: msg.content }],
                });
            }
            else if (msg.role === 'assistant') {
                input.push({
                    role: 'assistant',
                    content: [{ type: 'output_text', text: msg.content }],
                });
            }
        }
        return { instructions, input };
    }
    async *handleChat(messages, config, options) {
        const client = new openai_1.default({
            apiKey: config.api_key,
            baseURL: config.endpoint_url || this.defaultBaseUrl,
        });
        const { instructions, input } = this._convertMessages(messages);
        const params = {
            model: config.model_name || this.defaultModel,
            input,
            stream: !!options.stream,
        };
        if (instructions)
            params.instructions = instructions;
        if (options.max_tokens)
            params.max_output_tokens = options.max_tokens;
        if (config.temperature !== undefined)
            params.temperature = config.temperature;
        if (config.top_p !== undefined)
            params.top_p = config.top_p;
        if (config.extra_params && typeof config.extra_params === 'object') {
            Object.assign(params, config.extra_params);
        }
        try {
            if (params.stream) {
                const stream = await client.responses.create(params);
                let inReasoning = false;
                for await (const event of stream) {
                    if (event.type === 'response.reasoning_summary_text.delta') {
                        let text = event.delta;
                        if (!inReasoning) {
                            text = '<think>\n' + text;
                            inReasoning = true;
                        }
                        yield { type: 'delta', text };
                    }
                    else if (event.type === 'response.output_text.delta') {
                        let text = event.delta;
                        if (inReasoning) {
                            text = '\n</think>\n\n' + text;
                            inReasoning = false;
                        }
                        yield { type: 'delta', text };
                    }
                    else if (event.type === 'response.tool_call.created') {
                        const toolName = event.tool_call.name;
                        yield { type: 'delta', text: `\n<tool name="${toolName}">\n` };
                    }
                    else if (event.type === 'response.tool_call.output') {
                        yield { type: 'delta', text: `\n</tool>\n\n` };
                    }
                }
                yield { type: 'done', finishReason: 'stop' };
            }
            else {
                const response = await client.responses.create(params);
                let text = '';
                if (response.output) {
                    for (const item of response.output) {
                        if (item.type === 'message' && item.content) {
                            for (const part of item.content) {
                                if (part.type === 'output_text')
                                    text += part.text;
                            }
                        }
                    }
                }
                const usage = response.usage ? {
                    prompt_tokens: response.usage.input_tokens || 0,
                    completion_tokens: response.usage.output_tokens || 0,
                    total_tokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
                } : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
                if (text) {
                    yield { type: 'delta', text };
                }
                yield { type: 'done', finishReason: 'stop', usage };
            }
        }
        catch (err) {
            yield { type: 'error', message: err.message, code: err.status?.toString() };
        }
    }
}
exports.OpenAIResponsesProvider = OpenAIResponsesProvider;
//# sourceMappingURL=openai-responses.provider.js.map