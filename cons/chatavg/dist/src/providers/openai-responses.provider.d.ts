import { BaseProvider, ProviderConfig, ChatEvent } from './base.js';
import { ChatMessage } from '../types/chat.js';
export declare class OpenAIResponsesProvider extends BaseProvider {
    private defaultBaseUrl?;
    constructor(config: ProviderConfig & {
        defaultBaseUrl?: string;
    });
    private _convertMessages;
    handleChat(messages: ChatMessage[], config: any, options: any): AsyncIterable<ChatEvent>;
}
