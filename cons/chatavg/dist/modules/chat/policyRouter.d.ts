declare const _exports: PolicyRouter;
export = _exports;
declare class PolicyRouter {
    /**
     * Resolves the primary route and routing policies based on category settings.
     *
     * @param {Object} categorySettings - The configuration for the user's category
     * @returns {Object} Route resolution object containing the provider instance and policy details
     */
    resolveRoute(categorySettings: Object): Object;
}
