/**
 * MCP Gateway — Tool Definitions
 * Supports "Bastion Mode" where API keys and endpoints can be provided per-request.
 */
import { z } from 'zod';
import OpenAI from 'openai';
import { getProvider, listProviderNames } from './providers.js';
import logger from './logger.js';
import {
  buildResponsesParams,
  extractResponseText,
  shouldUseResponsesAPI,
} from './responses.js';

// ─── Client Resolver (Bastion Logic) ───────────────────────────────────
/**
 * Resolves which OpenAI client to use.
 * If credentials are provided in the request, it creates a temporary "bastion" client.
 * Otherwise, it fetches a pre-configured client from the registry.
 */
function resolveClient(providerName, api_key, endpoint_url) {
  if (api_key) {
    logger.debug(`[Bastion] Using provided API key for ${providerName}`);
    return new OpenAI({
      apiKey: api_key,
      baseURL: endpoint_url || undefined,
    });
  }
  return getProvider(providerName);
}

// ─── Qwen-specific middleware ───────────────────────────────────────────
function applyQwenFixes(providerName, extraParams) {
  if (providerName !== 'qwen') return extraParams;
  if (!Array.isArray(extraParams?.tools)) return extraParams;

  const hasWebSearch = extraParams.tools.some(t => t.type === 'web_search');
  if (!hasWebSearch) return extraParams;

  logger.debug('[ai.chat] Converting web_search → enable_search for Qwen');
  const fixed = { ...extraParams, enable_search: true };
  delete fixed.tools;
  delete fixed.tool_choice;
  return fixed;
}

// ─── Model string parser ────────────────────────────────────────────────
function parseModelString(model) {
  if (model.includes(':')) {
    const [provider, ...rest] = model.split(':');
    return { provider: provider.toLowerCase(), modelId: rest.join(':') };
  }
  return { provider: 'llama', modelId: model };
}

// ─── MCP result formatters ──────────────────────────────────────────────
function ok(text) {
  return { content: [{ type: 'text', text }] };
}

function err(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

// ─── Tool: ai.chat ──────────────────────────────────────────────────────
const chatTool = {
  name: 'ai.chat',
  description: "Multi-provider chat completions proxy. Supports Bastion mode (passing keys from client).",
  schema: {
    messages: z.array(
      z.object({ role: z.string(), content: z.string() })
    ).describe('Array of chat messages'),
    model: z.string().describe("Model name, optionally prefixed with provider (e.g. 'openai:gpt-4o')"),
    temperature: z.number().optional().describe('Sampling temperature'),
    max_tokens: z.number().optional().describe('Maximum tokens to generate'),
    stream: z.boolean().optional().describe('Stream output'),
    api_key: z.string().optional().describe('Optional: Provider API key for Bastion mode'),
    endpoint_url: z.string().optional().describe('Optional: Provider base URL for Bastion mode'),
    extra_params: z.any().optional().describe('Additional provider-specific parameters'),
  },
  handler: async ({ messages, model, temperature, max_tokens, api_key, endpoint_url, extra_params = {} }) => {
    try {
      const { provider: providerName, modelId } = parseModelString(model);
      const client = resolveClient(providerName, api_key, endpoint_url);

      logger.info(`ai.chat → ${providerName} | ${modelId} ${api_key ? '(Bastion Mode)' : ''}`);

      if (shouldUseResponsesAPI(providerName, extra_params)) {
        const params = buildResponsesParams({
          model: modelId,
          messages,
          temperature,
          max_tokens,
          extra_params,
        });

        logger.debug('[ai.chat] Using Responses API');
        const rawResponse = await client.responses.create(params);
        const text = extractResponseText(rawResponse)
                     || `Response completed (status: ${rawResponse.status})`;

        return ok(text);
      }

      const fixedExtra = applyQwenFixes(providerName, extra_params);
      const params = {
        messages,
        model: modelId,
        temperature,
        max_tokens,
        stream: false,
        ...fixedExtra,
      };

      const response = await client.chat.completions.create(params);
      return ok(response.choices[0].message.content);

    } catch (error) {
      logger.error('ai.chat error:', error.message);
      return err(error.message);
    }
  },
};

// ─── Tool: ai.responses ─────────────────────────────────────────────────
const responsesTool = {
  name: 'ai.responses',
  description: 'OpenAI Responses API — Supports Bastion mode (passing keys from client).',
  schema: {
    provider: z.string().describe("Provider name (e.g. 'openai', 'openai_responses')"),
    model: z.string().optional().describe('Model name'),
    api_key: z.string().optional().describe('Optional: Provider API key for Bastion mode'),
    endpoint_url: z.string().optional().describe('Optional: Provider base URL for Bastion mode'),
    prompt: z.object({
      id: z.string(),
      version: z.string().optional(),
    }).optional().describe('Managed prompt ID and version'),
    input: z.array(z.any()).optional().describe('Responses API input array'),
    instructions: z.string().optional().describe('System instructions'),
    max_output_tokens: z.number().optional().describe('Maximum output tokens'),
    reasoning: z.any().optional().describe('Reasoning config'),
    tools: z.array(z.any()).optional().describe('Tools configuration'),
    store: z.boolean().optional().describe('Store the response'),
    include: z.array(z.string()).optional().describe('Fields to include'),
    extra_params: z.any().optional().describe('Additional parameters'),
  },
  handler: async ({ provider, model, api_key, endpoint_url, prompt, input, instructions, max_output_tokens, reasoning, tools, store, include, extra_params = {} }) => {
    try {
      const providerName = (provider || 'openai_responses').toLowerCase();
      const client = resolveClient(providerName, api_key, endpoint_url);

      logger.info(`ai.responses → ${providerName} | Model: ${model || 'default'} ${api_key ? '(Bastion Mode)' : ''}`);

      const params = buildResponsesParams({
        model,
        prompt,
        input,
        instructions,
        max_tokens: max_output_tokens,
        extra_params: { reasoning, tools, store, include, ...extra_params },
      });

      if (params.prompt && params.model) {
        logger.debug('[ai.responses] Removing model (managed prompt overrides)');
        delete params.model;
      }

      const response = await client.responses.create(params);
      const text = extractResponseText(response)
                   || `Response completed (status: ${response.status})`;

      return ok(text);
    } catch (error) {
      logger.error('ai.responses error:', error.message);
      return err(error.message);
    }
  },
};

// ─── Tool: ai.models.list ───────────────────────────────────────────────
const modelsListTool = {
  name: 'ai.models.list',
  description: 'List available models. Supports Bastion mode.',
  schema: {
    api_key: z.string().optional().describe('Optional: API key'),
    endpoint_url: z.string().optional().describe('Optional: Base URL'),
    provider: z.string().optional().describe('Optional: Specific provider to query')
  },
  handler: async ({ api_key, endpoint_url, provider }) => {
    try {
      const allModels = [];

      if (api_key && provider) {
        const client = resolveClient(provider, api_key, endpoint_url);
        const response = await client.models.list();
        return ok(JSON.stringify(response.data.map(m => ({ id: `${provider}:${m.id}`, original_id: m.id })), null, 2));
      }

      const names = listProviderNames();
      const seen = new Set();
      for (const name of names) {
        const client = getProvider(name);
        if (seen.has(client)) continue;
        seen.add(client);
        try {
          const response = await client.models.list();
          allModels.push(...response.data.map(m => ({ id: `${name}:${m.id}`, provider: name })));
        } catch (e) {
          logger.warn(`ai.models.list failed for ${name}: ${e.message}`);
        }
      }
      return ok(JSON.stringify(allModels, null, 2));
    } catch (error) {
      logger.error('ai.models.list error:', error.message);
      return err(error.message);
    }
  },
};

export const TOOLS = [chatTool, responsesTool, modelsListTool];
