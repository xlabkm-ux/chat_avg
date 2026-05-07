
/**
 * RolePass — capability-based authorization system.
 */
class RolePass {
  constructor(id, scope = 'all', options = {}) {
    this.id = id;
    this.scope = scope;
    this.options = options;
  }
}

class RoleRegistry {
  constructor() {
    this.roles = new Map();
    this._setupDefaultRoles();
  }

  /**
   * Registers a new role.
   * @param {string} roleId 
   * @param {RolePass[]} passes 
   */
  registerRole(roleId, passes) {
    this.roles.set(roleId, passes);
  }

  /**
   * Checks if a role has a specific pass.
   * @param {string} roleId 
   * @param {string} passId 
   * @returns {boolean}
   */
  hasPass(roleId, passId) {
    const passes = this.roles.get(roleId);
    if (!passes) return false;
    return passes.some(p => p.id === passId);
  }

  /**
   * Verifies a pass or throws.
   * @param {string} roleId 
   * @param {string} passId 
   */
  verifyPass(roleId, passId) {
    if (!this.hasPass(roleId, passId)) {
      throw new Error(`Forbidden: Role '${roleId}' lacks required Pass '${passId}'`);
    }
  }

  /**
   * Default roles for PoC.
   * @private
   */
  _setupDefaultRoles() {
    this.registerRole('analyst', [
      new RolePass('observer'),
      new RolePass('boundary'),
      new RolePass('trajectory'),
      new RolePass('language')
    ]);

    this.registerRole('builder', [
      new RolePass('observer'),
      new RolePass('boundary'),
      new RolePass('builder'),
      new RolePass('language')
    ]);

    this.registerRole('admin', [
      new RolePass('observer'),
      new RolePass('boundary'),
      new RolePass('builder'),
      new RolePass('trajectory'),
      new RolePass('language'),
      new RolePass('system')
    ]);
  }
}

module.exports = new RoleRegistry();
