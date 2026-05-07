declare const _exports: ChatService;
export = _exports;
declare class ChatService {
    handleCompletion({ user, body, res }: {
        user: any;
        body: any;
        res: any;
    }): Promise<any>;
    _createEmulatedAsyncIterable(text: any, usage: any): AsyncGenerator<import("../providers/providerEvents").CanonicalChatEvent, void, unknown>;
    _handleError(err: any, providerId: any, providerName: any, res: any): void;
}
