import { ChatMessage, ChatAVGResponse } from '../types/chat.js';

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

export type ChatEvent = 
  | { type: 'delta'; text: string }
  | { type: 'done'; finishReason: string; usage?: any }
  | { type: 'error'; message: string; code?: string };

export abstract class BaseProvider {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
  capabilities: {
    stream: boolean;
    tools: boolean;
  };

  constructor(config: ProviderConfig) {
    if (!config.id || !config.name) {
      throw new Error('Provider must have an id and name');
    }
    this.id = config.id;
    this.name = config.name;
    this.models = config.models || [];
    this.defaultModel = config.defaultModel || '';
    this.capabilities = {
      stream: true,
      tools: false,
      ...config.capabilities
    };
  }

  abstract handleChat(
    messages: ChatMessage[],
    config: any,
    options: any
  ): AsyncIterable<ChatEvent>;

  async checkHealth(config: any): Promise<boolean> {
    return true;
  }

  protected buildChunk(model: string, text: string, finishReason: string | null = null, toolCalls: any = null) {
    const delta: any = {};
    if (finishReason) {
      // No delta content
    } else if (toolCalls) {
      delta.tool_calls = toolCalls;
    } else {
      delta.content = text;
    }

    return {
      id: `chatcmpl-${this.id}-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: model || this.defaultModel,
      choices: [{
        index: 0,
        delta,
        finish_reason: finishReason,
      }],
    };
  }

  protected buildResponse(model: string, text: string, usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, toolCalls: any = null) {
    const message: any = { role: 'assistant', content: text };
    if (toolCalls) message.tool_calls = toolCalls;

    return {
      id: `chatcmpl-${this.id}-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || this.defaultModel,
      choices: [{
        index: 0,
        message,
        finish_reason: toolCalls ? 'tool_calls' : 'stop',
      }],
      usage,
    };
  }
}
