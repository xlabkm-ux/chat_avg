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
  USER: ['response_format', 'tools', 'reasoning'],
  ADMIN: ['tools', 'tool_choice', 'reasoning', 'response_format', 'metadata']
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
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  allowedOrigins: env.CHATAVG_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
};
