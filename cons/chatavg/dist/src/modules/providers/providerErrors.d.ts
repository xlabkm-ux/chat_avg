export class ProviderError extends Error {
    constructor(message: any, status?: number, code?: string, isRetryable?: boolean, details?: null);
    status: number;
    code: string;
    isRetryable: boolean;
    details: any;
}
