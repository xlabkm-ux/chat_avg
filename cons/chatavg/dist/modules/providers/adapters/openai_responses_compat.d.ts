export class OpenAIResponsesProvider extends BaseProvider {
    constructor(config: any);
    defaultBaseUrl: any;
    /**
     * Convert OpenAI chat messages to Responses API format
     * system → instructions, user/assistant → input array
     */
    _convertMessages(messages: any): {
        instructions: string;
        input: {
            role: string;
            content: {
                type: string;
                text: any;
            }[];
        }[];
    };
    handleChat(messages: any, config: any, options: any): AsyncGenerator<import("./../providerEvents").CanonicalChatEvent, void, unknown>;
    checkHealth(config: any): Promise<boolean>;
    getModels(config: any): Promise<any>;
}
export function createResponsesProvider(config: any): OpenAIResponsesProvider;
import BaseProvider = require("../base.provider");
