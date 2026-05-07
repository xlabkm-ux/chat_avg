declare const _exports: LlamaCppProvider;
export = _exports;
declare class LlamaCppProvider extends BaseProvider {
    constructor();
    handleChat(messages: any, config: any, options: any): AsyncGenerator<import("./../providerEvents").CanonicalChatEvent, void, unknown>;
    checkHealth(config: any): Promise<boolean>;
    getModels(config: any): Promise<any>;
}
import BaseProvider = require("../base.provider");
