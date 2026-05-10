import OpenAI from 'openai';
import config from './config.js';
import logger from './logger.js';
import { ProviderNotFoundError } from './errors.js';

/** @type {Map<string, OpenAI>} */
const registry = new Map();

/**
 * Initialize all providers from config.
 * Returns a summary of registered names.
 */
export function initProviders() {
  const registered = [];

  for (const prov of config.providers) {
    const client = new OpenAI({
      apiKey: prov.apiKey,
      baseURL: prov.baseURL,
    });

    registry.set(prov.name, client);
    registered.push(prov.name);
    logger.info(`Registered provider: ${prov.name} (URL: ${prov.baseURL})`);

    // Register aliases (e.g. openai_prompt_file_search → openai_responses client)
    for (const alias of prov.aliases) {
      if (!registry.has(alias)) {
        registry.set(alias, client);
        registered.push(`${alias} (→${prov.name})`);
        logger.info(`Registered alias: ${alias} → ${prov.name}`);
      }
    }
  }

  if (registry.size === 0) {
    logger.warn('No providers configured. Gateway will reject all requests.');
  }

  return registered;
}

/**
 * Resolve a provider client by name.
 * @param {string} name - Provider name (lowercase)
 * @returns {OpenAI}
 * @throws {ProviderNotFoundError} if provider not found
 */
export function getProvider(name) {
  const client = registry.get(name.toLowerCase());
  if (!client) {
    throw new ProviderNotFoundError(name);
  }
  return client;
}


/**
 * List all registered provider names.
 * @returns {string[]}
 */
export function listProviderNames() {
  return Array.from(registry.keys());
}
