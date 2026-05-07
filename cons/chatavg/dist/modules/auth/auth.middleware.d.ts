/**
 * Express middleware: validate Bearer token, attach `req.user`.
 */
export function authenticate(req: any, res: any, next: any): Promise<any>;
/**
 * Express middleware: require Администратор category.
 */
export function requireAdmin(req: any, res: any, next: any): any;
/**
 * Create a signed JWT for the given user.
 */
export function signToken(user: any): any;
/**
 * Check if user account has expired.
 * @returns {boolean} true if expired
 */
export function isExpired(user: any): boolean;
