declare const _exports: MCPProvider;
export = _exports;
declare class MCPProvider extends BaseProvider {
    constructor(config: any);
    handleChat(messages: any, config: any, options: any): AsyncGenerator<ProviderEvents.CanonicalChatEvent, void, unknown>;
    checkHealth(config: any): Promise<boolean>;
    getModels(config: any): Promise<string[]>;
}
import BaseProvider = require("../base.provider");
import ProviderEvents = require("../providerEvents");
