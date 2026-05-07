export type CanonicalChatEvent = {
    type: "delta" | "tool_call" | "done" | "error";
    /**
     * - For 'delta' events
     */
    text?: string | undefined;
    /**
     * - For 'tool_call' events
     */
    toolCall?: Object | undefined;
    /**
     * - For 'done' events
     */
    finishReason?: string | undefined;
    /**
     * - For 'done' events
     */
    usage?: Object | undefined;
    /**
     * - For 'error' events
     */
    message?: string | undefined;
    /**
     * - For 'error' events
     */
    code?: string | undefined;
};
