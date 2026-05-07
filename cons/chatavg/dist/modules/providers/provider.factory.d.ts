/**
 * Get provider adapter by provider ID from config
 * @param {string} configProviderId - Provider ID from providers.config.js
 * @returns {Object|null} Provider adapter or null
 */
export function getProvider(configProviderId: string): Object | null;
/**
 * List all configured providers (for admin UI)
 * @returns {Array} [{id, name, models: [modelId1, modelId2, ...]}]
 */
export function listProviders(): any[];
export namespace adapters {
    export { mock as deterministic };
}
declare const mock: DeterministicProvider;
import { DeterministicProvider } from "../../../tests/mocks/deterministic_provider";
export {};
