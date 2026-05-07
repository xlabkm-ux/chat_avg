export class RedactionService {
    /**
     * Redacts sensitive information from a string or object payload.
     * Basic implementation: regex to hide common secrets (Bearer tokens, api keys, passwords).
     * @param {any} payload
     * @returns {any} redacted payload
     */
    static redact(payload: any): any;
}
