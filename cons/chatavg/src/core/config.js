/**
 * Application Configuration
 * Centralized constants, paths, and environment settings.
 */
const path = require('path');
const { z } = require('zod');

// Base directory (root of the project)
const ROOT_DIR = path.resolve(__dirname, '../../');

// 1. Load Environment Variables
const envPath = path.join(ROOT_DIR, '.env');
require('dotenv').config({ path: envPath });

// 2. Validate Environment Variables
const envSchema = z.object({
  CHATAVG_PORT: z.string().transform(Number).default('8200'),
  CHATAVG_SECRET: z.string().min(32, 'CHATAVG_SECRET must be at least 32 characters long'),
  CHATAVG_TOKEN_EXPIRY: z.string().default('7d'),
  CHATAVG_ADMIN_PASSWORD: z.string().optional(),
  CHATAVG_ALLOWED_ORIGINS: z.string().optional().default(''),
  CHATAVG_PROVIDER_TIMEOUT: z.string().transform(Number).default('60000'),
  CHATAVG_TEST_TIMEOUT: z.string().transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  // Provider variables
  LLAMACPP_URL: z.string().optional(),
  LLAMACPP_API_KEY: z.string().optional(),
  OPENAI_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  QWEN_URL: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),
  GROK_URL: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  MCP_GATEWAY_URL: z.string().optional(),
  MCP_API_KEY: z.string().optional(),
  // Feature Flags
  SEMANTIC_LAYER_ENABLED: z.string().transform(v => v === 'true').default('false'),
  AGENT_RUNS_ENABLED: z.string().transform(v => v === 'true').default('false'),
  MODEL_GATEWAY_ENABLED: z.string().transform(v => v === 'true').default('false'),
  LITELLM_ENABLED: z.string().transform(v => v === 'true').default('false'),
  KNOWLEDGE_GATEWAY_ENABLED: z.string().transform(v => v === 'true').default('false'),
  TOOL_GATEWAY_ENABLED: z.string().transform(v => v === 'true').default('false'),
  SANDBOX_FORGE_ENABLED: z.string().transform(v => v === 'true').default('false'),
  TEMPORAL_RUNTIME_ENABLED: z.string().transform(v => v === 'true').default('false'),
  TEMPORAL_URL: z.string().default('localhost:7233'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

const env = parsedEnv.data;

// 3. Constants & Paths
const PORT = env.CHATAVG_PORT;
const SECRET = env.CHATAVG_SECRET;
const TOKEN_EXPIRY = env.CHATAVG_TOKEN_EXPIRY;
const PROVIDER_TIMEOUT = env.CHATAVG_PROVIDER_TIMEOUT;
const TEST_TIMEOUT = env.CHATAVG_TEST_TIMEOUT;

const DATA_DIR = env.NODE_ENV === 'test' 
  ? path.join(ROOT_DIR, 'data_test') 
  : path.join(ROOT_DIR, 'data');

const WEBUI_DIR = path.join(ROOT_DIR, 'webui_original');

const LLAMA_DEFAULT_URL = 'http://127.0.0.1:8201';

// 4. Chat & Provider Configuration
const ALLOWED_EXTRA_PARAMS = {
  USER: ['response_format', 'tools', 'reasoning', 'collection_ids', 'vector_store_ids', 'enable_search'],
  ADMIN: ['tools', 'tool_choice', 'reasoning', 'response_format', 'metadata', 'collection_ids', 'vector_store_ids', 'enable_search']
};

const DEFAULT_CATEGORY_PARAMS = {
  provider: 'llamacpp',
  model_name: 'default',
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  repeat_penalty: 1.1,
  max_tokens: 1024,
  system_prompt: '',
  mcp_gateway: '',
};

const DEFAULT_SYSTEM_PROMPT = 'Ты — полезный ИИ-ассистент Gemma 4. Отвечай точно и по существу.';

// Feature Flags
const FEATURE_FLAGS = {
  SEMANTIC_LAYER_ENABLED: env.SEMANTIC_LAYER_ENABLED,
  AGENT_RUNS_ENABLED: env.AGENT_RUNS_ENABLED,
  MODEL_GATEWAY_ENABLED: env.MODEL_GATEWAY_ENABLED,
  LITELLM_ENABLED: env.LITELLM_ENABLED,
  KNOWLEDGE_GATEWAY_ENABLED: env.KNOWLEDGE_GATEWAY_ENABLED,
  TOOL_GATEWAY_ENABLED: env.TOOL_GATEWAY_ENABLED,
  SANDBOX_FORGE_ENABLED: env.SANDBOX_FORGE_ENABLED,
  TEMPORAL_RUNTIME_ENABLED: env.TEMPORAL_RUNTIME_ENABLED,
};
const {
  SEMANTIC_LAYER_ENABLED,
  AGENT_RUNS_ENABLED,
  MODEL_GATEWAY_ENABLED,
  LITELLM_ENABLED,
  KNOWLEDGE_GATEWAY_ENABLED,
  TOOL_GATEWAY_ENABLED,
  SANDBOX_FORGE_ENABLED,
  TEMPORAL_RUNTIME_ENABLED,
} = FEATURE_FLAGS;

module.exports = {
  PORT,
  SECRET,
  TOKEN_EXPIRY,
  PROVIDER_TIMEOUT,
  TEST_TIMEOUT,
  DATA_DIR,
  WEBUI_DIR,
  LLAMA_DEFAULT_URL,
  ALLOWED_EXTRA_PARAMS,
  DEFAULT_CATEGORY_PARAMS,
  DEFAULT_SYSTEM_PROMPT,
  SEMANTIC_LAYER_ENABLED,
  AGENT_RUNS_ENABLED,
  MODEL_GATEWAY_ENABLED,
  LITELLM_ENABLED,
  KNOWLEDGE_GATEWAY_ENABLED,
  TOOL_GATEWAY_ENABLED,
  SANDBOX_FORGE_ENABLED,
  TEMPORAL_RUNTIME_ENABLED,
  TEMPORAL_URL: env.TEMPORAL_URL,
  FEATURE_FLAGS,
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  allowedOrigins: env.CHATAVG_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  providerEnv: {
    LLAMACPP_URL: env.LLAMACPP_URL,
    LLAMACPP_API_KEY: env.LLAMACPP_API_KEY,
    OPENAI_URL: env.OPENAI_URL,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    DEEPSEEK_URL: env.DEEPSEEK_URL,
    DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
    GEMINI_API_KEY: env.GEMINI_API_KEY,
    QWEN_URL: env.QWEN_URL,
    QWEN_API_KEY: env.QWEN_API_KEY,
    GROK_URL: env.GROK_URL,
    GROK_API_KEY: env.GROK_API_KEY,
    MCP_GATEWAY_URL: env.MCP_GATEWAY_URL,
    MCP_API_KEY: env.MCP_API_KEY
  }
};
