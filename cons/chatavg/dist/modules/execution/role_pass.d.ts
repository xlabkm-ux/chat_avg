declare const _exports: RoleRegistry;
export = _exports;
declare class RoleRegistry {
    roles: Map<any, any>;
    /**
     * Registers a new role.
     * @param {string} roleId
     * @param {RolePass[]} passes
     */
    registerRole(roleId: string, passes: RolePass[]): void;
    /**
     * Checks if a role has a specific pass.
     * @param {string} roleId
     * @param {string} passId
     * @returns {boolean}
     */
    hasPass(roleId: string, passId: string): boolean;
    /**
     * Verifies a pass or throws.
     * @param {string} roleId
     * @param {string} passId
     */
    verifyPass(roleId: string, passId: string): void;
    /**
     * Default roles for PoC.
     * @private
     */
    private _setupDefaultRoles;
}
/**
 * RolePass — capability-based authorization system.
 */
declare class RolePass {
    constructor(id: any, scope?: string, options?: {});
    id: any;
    scope: string;
    options: {};
}
