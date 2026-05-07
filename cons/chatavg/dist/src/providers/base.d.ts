import { ChatMessage } from '../types/chat.js';
export type ProviderConfig = {
    id: string;
    name: string;
    models?: string[];
    defaultModel?: string;
    capabilities?: {
        stream?: boolean;
        tools?: boolean;
    };
};
export type ChatEvent = {
    type: 'delta';
    text: string;
} | {
    type: 'done';
    finishReason: string;
    usage?: any;
} | {
    type: 'error';
    message: string;
    code?: string;
};
export declare abstract class BaseProvider {
    id: string;
    name: string;
    models: string[];
    defaultModel: string;
    capabilities: {
        stream: boolean;
        tools: boolean;
    };
    constructor(config: ProviderConfig);
    abstract handleChat(messages: ChatMessage[], config: any, options: any): AsyncIterable<ChatEvent>;
    checkHealth(config: any): Promise<boolean>;
    protected buildChunk(model: string, text: string, finishReason?: string | null, toolCalls?: any): {
        id: string;
        object: string;
        created: number;
        model: string;
        choices: {
            index: number;
            delta: any;
            finish_reason: string | null;
        }[];
    };
    protected buildResponse(model: string, text: string, usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }, toolCalls?: any): {
        id: string;
        object: string;
        created: number;
        model: string;
        choices: {
            index: number;
            message: any;
            finish_reason: string;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
}
