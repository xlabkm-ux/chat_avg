/**
 * Helper Utilities
 */
export function assertSafeIdentifier(value: any, field: any): any;
/**
 * Merge only defined (not `undefined`) fields from `source` into `target`.
 * Avoids repetitive `if (x !== undefined) target.x = x;` blocks.
 */
export function mergeFields(target: any, source: any, keys: any): void;
/**
 * Strict URL validation for SSRF Protection.
 * @param {string} endpointUrl - The URL to validate
 * @param {boolean} allowLocal - Whether to allow private IPs/localhost (for local providers)
 */
export function validateProviderUrl(endpointUrl: string, allowLocal?: boolean): void;
export function sanitizePromptText(text: any): string;
