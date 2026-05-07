export class OpenAICompatProvider extends BaseProvider {
    constructor(config: any);
    defaultBaseUrl: any;
    /**
     * Handle chat completion request
     * @param {Array} messages - Chat messages [{role, content}]
     * @param {Object} config  - Category config (api_key, model_name, temperature, etc.)
     * @param {Object} options - Request options (stream, max_tokens)
     * @returns {Object} ProviderResult
     */
    handleChat(messages: any[], config: Object, options: Object): Object;
    checkHealth(config: any): Promise<boolean>;
    getModels(config: any): Promise<any>;
}
export function createProvider(config: any): OpenAICompatProvider;
import BaseProvider = require("../base.provider");
