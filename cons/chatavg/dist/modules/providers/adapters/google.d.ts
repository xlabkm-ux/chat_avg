declare const _exports: GoogleProvider;
export = _exports;
declare class GoogleProvider extends BaseProvider {
    constructor();
    /**
     * Convert OpenAI-format messages to Gemini format
     */
    _convertMessages(messages: any): {
        systemInstruction: string;
        history: {
            role: string;
            parts: {
                text: any;
            }[];
        }[];
    };
    handleChat(messages: any, config: any, options: any): AsyncGenerator<import("./../providerEvents").CanonicalChatEvent, void, unknown>;
    checkHealth(config: any): Promise<boolean>;
}
import BaseProvider = require("../base.provider");
