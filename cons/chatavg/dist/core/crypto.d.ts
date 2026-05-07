/**
 * Encrypts a string.
 * Returns format: iv.content.tag (base64 encoded parts)
 */
export function encrypt(text: any): string | null;
/**
 * Decrypts a string in the format: iv.content.tag
 */
export function decrypt(encryptedData: any): any;
/**
 * Masks an API key for safe display (e.g. sk-...abcd)
 */
export function maskKey(key: any): string;
