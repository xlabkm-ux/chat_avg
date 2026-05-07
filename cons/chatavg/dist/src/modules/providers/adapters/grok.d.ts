declare const _exports: GrokProvider;
export = _exports;
declare class GrokProvider extends OpenAICompatProvider {
    _searchCollections(query: any, collectionIds: any, apiKey: any): Promise<string>;
    handleChat(messages: any, config: any, options: any): AsyncGenerator<any, void, unknown>;
}
import { OpenAICompatProvider } from "./openai_compat";
