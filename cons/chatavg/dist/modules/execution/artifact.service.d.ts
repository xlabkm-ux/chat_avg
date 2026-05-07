declare const _exports: ArtifactService;
export = _exports;
/**
 * ArtifactService — manages versioned artifacts and patches.
 */
declare class ArtifactService {
    artifacts: Map<any, any>;
    patches: any[];
    /**
     * Creates a new artifact.
     * @param {string} roleId
     * @param {Object} data { type, title, content }
     * @returns {Object}
     */
    createArtifact(roleId: string, data: Object): Object;
    /**
     * Applies a patch to an artifact.
     * @param {string} roleId
     * @param {string} artifactId
     * @param {Object} patch { diff, reason, decisionId }
     * @returns {Object}
     */
    applyPatch(roleId: string, artifactId: string, patch: Object): Object;
    /**
     * Get artifact by ID.
     */
    getArtifact(id: any): any;
    /**
     * List all artifacts in a session (simplified).
     */
    listArtifacts(): any[];
}
