import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../');

// Load environment variables
const envPath = path.join(ROOT_DIR, '.env');
dotenv.config({ path: envPath });

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

export const env = parsedEnv.data;

export const config = {
  PORT: env.CHATAVG_PORT,
  SECRET: env.CHATAVG_SECRET,
  TOKEN_EXPIRY: env.CHATAVG_TOKEN_EXPIRY,
  PROVIDER_TIMEOUT: env.CHATAVG_PROVIDER_TIMEOUT,
  TEST_TIMEOUT: env.CHATAVG_TEST_TIMEOUT,
  DATA_DIR: env.NODE_ENV === 'test' 
    ? path.join(ROOT_DIR, 'data_test') 
    : path.join(ROOT_DIR, 'data'),
  WEBUI_DIR: path.join(ROOT_DIR, 'webui_original'),
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  allowedOrigins: env.CHATAVG_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
};
