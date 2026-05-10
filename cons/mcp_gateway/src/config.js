import { z } from 'zod';

/**
 * Provider definition schema:
 * { name: string, key: string, url?: string, aliases?: string[] }
 */
function loadProviderConfigs() {
  const env = process.env;
  const configs = [];

  // Explicit provider definitions (preferred over regex scanning)
  const KNOWN_PROVIDERS = [
    {
      name: 'openai',
      keyEnv: ['MCP_OPENAI_KEY', 'OPENAI_API_KEY', 'MCP_PROVIDER_OPENAI_KEY'],
      urlEnv: ['MCP_OPENAI_URL', 'OPENAI_URL'],
      defaultUrl: 'https://api.openai.com/v1',
    },
    {
      name: 'openai_responses',
      keyEnv: ['MCP_OPENAI_RESPONSES_KEY', 'OPENAI_RESPONSES_KEY', 'MCP_OPENAI_KEY', 'OPENAI_API_KEY'],
      urlEnv: ['MCP_OPENAI_URL', 'OPENAI_URL'],
      defaultUrl: 'https://api.openai.com/v1',
      aliases: ['openai_prompt_file_search'],
    },
    {
      name: 'deepseek',
      keyEnv: ['MCP_DEEPSEEK_KEY', 'DEEPSEEK_API_KEY', 'MCP_PROVIDER_DEEPSEEK_KEY'],
      urlEnv: ['MCP_DEEPSEEK_URL', 'DEEPSEEK_URL'],
      defaultUrl: 'https://api.deepseek.com/v1',
    },
    {
      name: 'qwen',
      keyEnv: ['MCP_QWEN_KEY', 'QWEN_API_KEY', 'MCP_PROVIDER_QWEN_KEY'],
      urlEnv: ['MCP_QWEN_URL', 'QWEN_URL'],
      defaultUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    },
    {
      name: 'grok',
      keyEnv: ['MCP_GROK_KEY', 'GROK_API_KEY'],
      urlEnv: ['MCP_GROK_URL', 'GROK_URL'],
      defaultUrl: 'https://api.x.ai/v1',
    },
    {
      name: 'llama',
      keyEnv: ['MCP_LLAMA_KEY', 'LLAMACPP_API_KEY', 'MCP_PROVIDER_LLAMA_KEY'],
      urlEnv: ['MCP_LLAMA_URL', 'LLAMACPP_URL'],
      defaultUrl: 'http://localhost:8201/v1',
    },
  ];

  for (const def of KNOWN_PROVIDERS) {
    const apiKey = resolveEnv(env, def.keyEnv) || 'bastion-mode-only';
    const url = resolveEnv(env, def.urlEnv) || def.defaultUrl;
    
    configs.push({
      name: def.name,
      apiKey,
      baseURL: url,
      aliases: def.aliases || [],
    });
  }

  return configs;
}

/** Resolve first available env var from a list of candidates */
function resolveEnv(env, candidates) {
  for (const key of candidates) {
    if (env[key]) return env[key];
  }
  return null;
}

const configSchema = z.object({
  port: z.number().int().positive(),
  debugPrefix: z.boolean(),
  providers: z.array(z.object({
    name: z.string(),
    apiKey: z.string(),
    baseURL: z.string().url(),
    aliases: z.array(z.string())
  }))
});

const rawConfig = {
  port: parseInt(process.env.PORT || '8202', 10),
  debugPrefix: process.env.MCP_DEBUG_PREFIX === 'true',
  providers: loadProviderConfigs(),
};

const config = configSchema.parse(rawConfig);

export default config;

