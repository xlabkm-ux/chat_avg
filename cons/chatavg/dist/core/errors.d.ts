export class AppError extends Error {
    constructor(message: any, status?: number, code?: string, details?: null);
    status: number;
    code: string;
    details: any;
    isOperational: boolean;
}
export class AuthError extends AppError {
    constructor(message?: string, details?: null);
}
export class ValidationError extends AppError {
    constructor(message?: string, details?: null);
}
export class NotFoundError extends AppError {
    constructor(message?: string);
}
/**
 * Wrap an async Express handler so thrown errors are forwarded to `next()`.
 */
export function asyncHandler(fn: any): (req: any, res: any, next: any) => void;
/**
 * Global Express error handler.
 */
export function errorHandler(err: any, req: any, res: any, _next: any): void;
