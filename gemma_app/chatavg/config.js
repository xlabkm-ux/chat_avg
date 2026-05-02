/**
 * Application Configuration
 * Centralized constants, paths, and environment settings.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

const PORT = parseInt(process.env.CHATAVG_PORT || '8080', 10);
const SECRET = process.env.CHATAVG_SECRET;

if (!SECRET || SECRET.length < 32) {
  throw new Error('CHATAVG_SECRET must be set and at least 32 characters long. Please set it in your environment variables or .env file.');
}

const TOKEN_EXPIRY = '7d';

const DATA_DIR = process.env.NODE_ENV === 'test' 
  ? path.join(__dirname, 'data_test') 
  : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const SESSIONS_ROOT = path.join(DATA_DIR, 'sessions');
const WEBUI_DIR = path.join(__dirname, 'webui_original');

const LLAMA_DEFAULT_URL = 'http://127.0.0.1:8081/v1';

// Default generation parameters for new categories
const DEFAULT_CATEGORY_PARAMS = {
  provider: 'llamacpp',
  endpoint_url: LLAMA_DEFAULT_URL,
  api_key: '',
  model_name: '',
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  repeat_penalty: 1.1,
  max_tokens: 1024,
  system_prompt: '',
};

const DEFAULT_SYSTEM_PROMPT = 'Ты — полезный ИИ-ассистент Gemma 4. Отвечай точно и по существу.';

module.exports = {
  PORT,
  SECRET,
  TOKEN_EXPIRY,
  DATA_DIR,
  USERS_FILE,
  CATEGORIES_FILE,
  SESSIONS_ROOT,
  WEBUI_DIR,
  LLAMA_DEFAULT_URL,
  DEFAULT_CATEGORY_PARAMS,
  DEFAULT_SYSTEM_PROMPT,
};
