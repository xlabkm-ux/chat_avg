declare const _exports: FallbackPolicy;
export = _exports;
declare class FallbackPolicy {
    /**
     * Determines if the given error allows for a fallback to another provider.
     * Only retryable errors (like network timeout, 502, connection refused) should trigger fallback.
     *
     * @param {Error|Object} err - The error object or event
     * @returns {boolean} True if fallback is allowed
     */
    shouldFallback(err: Error | Object): boolean;
}
