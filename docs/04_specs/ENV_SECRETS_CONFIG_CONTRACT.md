---
id: SPEC-025
title: Environment and Secrets Configuration Contract
version: 1.0.0
owner: SRE + Security
status: Active
last_updated: 2026-05-07
sprint: Sprint 1
---

# ENV and Secrets Configuration Contract

**Status:** Active  
**Owner:** SRE + Security  

## 1. Principles
- **No hardcoded secrets:** Code must never contain API keys, passwords, or encryption keys.
- **Centralized validation:** All environment variables are loaded and validated strictly via `Zod` in `src/core/config.js`. Provider configurations import these verified variables.
- **Fail-fast:** The application must crash immediately on startup if any required environment variable is missing or malformed, avoiding unpredictable failures later.

## 2. Environment Variables

### Application Core
- `CHATAVG_PORT`: Application port (default: 8200)
- `CHATAVG_SECRET`: Secure encryption key for JWT and data (min 32 chars) - **REQUIRED**
- `CHATAVG_TOKEN_EXPIRY`: JWT token expiration time (default: 7d)
- `CHATAVG_ADMIN_PASSWORD`: Optional initial administrator password.
- `CHATAVG_ALLOWED_ORIGINS`: Comma-separated CORS origins.
- `CHATAVG_PROVIDER_TIMEOUT`: HTTP request timeout for model providers (ms).
- `CHATAVG_TEST_TIMEOUT`: HTTP request timeout during testing.
- `NODE_ENV`: Runtime environment (`development`, `production`, `test`).

### Model Providers
- `LLAMACPP_URL` / `LLAMACPP_API_KEY`: Configuration for local Llama.cpp instances.
- `OPENAI_URL` / `OPENAI_API_KEY`: Configuration for OpenAI.
- `DEEPSEEK_URL` / `DEEPSEEK_API_KEY`: Configuration for DeepSeek.
- `GEMINI_API_KEY`: Configuration for Google Gemini.
- `QWEN_URL` / `QWEN_API_KEY`: Configuration for Qwen.
- `GROK_URL` / `GROK_API_KEY`: Configuration for xAI Grok.
- `MCP_GATEWAY_URL` / `MCP_API_KEY`: Configuration for local MCP Gateway.

## 3. Secret Scopes
- **Local:** Managed via local `.env` file (not committed to source control).
- **Staging/Production:** Injected via secure CI/CD pipelines or secret managers (e.g., Vault, AWS Secrets Manager, GitHub Secrets).

## 4. Prompts and Secrets
- Under no circumstances should external API keys or DB credentials be injected into model-visible context (System Prompts).
- Provider adapters must strip authorization headers before logging request payloads for debugging.

## 5. Code Examples

### Example 1: Zod Schema Validation for Environment Variables

```javascript
// src/core/config.js
const { z } = require('zod');
require('dotenv').config();

// Define validation schema
const EnvSchema = z.object({
  // Application Core
  CHATAVG_PORT: z.string().transform(Number).default('8200'),
  CHATAVG_SECRET: z.string().min(32, 'CHATAVG_SECRET must be at least 32 characters'),
  CHATAVG_TOKEN_EXPIRY: z.string().default('7d'),
  CHATAVG_ADMIN_PASSWORD: z.string().optional(),
  CHATAVG_ALLOWED_ORIGINS: z.string().default('*'),
  CHATAVG_PROVIDER_TIMEOUT: z.string().transform(Number).default('30000'),
  CHATAVG_TEST_TIMEOUT: z.string().transform(Number).default('10000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Model Providers
  LLAMACPP_URL: z.string().url().optional(),
  LLAMACPP_API_KEY: z.string().optional(),
  OPENAI_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: z.string().optional(),
  DEEPSEEK_URL: z.string().url().default('https://api.deepseek.com/v1'),
  DEEPSEEK_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  QWEN_URL: z.string().url().default('https://dashscope.aliyuncs.com/api/v1'),
  QWEN_API_KEY: z.string().optional(),
  GROK_URL: z.string().url().default('https://api.x.ai/v1'),
  GROK_API_KEY: z.string().optional(),
  MCP_GATEWAY_URL: z.string().url().optional(),
  MCP_API_KEY: z.string().optional(),

  // LiteLLM Gateway
  LITELLM_ENABLED: z.string().transform(val => val === 'true').default('false'),
  LITELLM_PROXY_URL: z.string().url().default('http://127.0.0.1:4000/v1'),

  // E2B Sandbox
  E2B_API_KEY: z.string().optional(),
  E2B_TEMPLATE: z.string().default('base'),
});

// Load and validate environment
function loadConfig() {
  try {
    const env = EnvSchema.parse(process.env);
    console.log('Environment configuration loaded and validated');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

const config = loadConfig();
module.exports = config;
```

### Example 2: Secret Rotation and Management

```javascript
// src/services/secretManager.service.js
const crypto = require('crypto');
const fs = require('fs').promises;

class SecretManager {
  constructor(config) {
    this.config = config;
    this.rotationLog = [];
  }

  async rotateSecret(secretName, newSecret) {
    const previousSecret = this.config[secretName];

    if (!previousSecret) {
      throw new Error(`Secret not found: ${secretName}`);
    }

    // Validate new secret format
    this.validateSecretFormat(secretName, newSecret);

    // Update in-memory config
    this.config[secretName] = newSecret;

    // Log rotation event
    this.rotationLog.push({
      secretName,
      rotatedAt: new Date().toISOString(),
      reason: 'Manual rotation',
    });

    console.log(`Secret rotated: ${secretName}`);

    // If using file-based secrets, update .env file
    if (this.config.SECRET_STORAGE === 'file') {
      await this.updateEnvFile(secretName, newSecret);
    }

    return {
      secretName,
      rotatedAt: new Date().toISOString(),
      success: true,
    };
  }

  validateSecretFormat(secretName, secret) {
    switch (secretName) {
      case 'CHATAVG_SECRET':
        if (secret.length < 32) {
          throw new Error('CHATAVG_SECRET must be at least 32 characters');
        }
        break;
      case 'OPENAI_API_KEY':
        if (!secret.startsWith('sk-')) {
          throw new Error('Invalid OpenAI API key format');
        }
        break;
      case 'GEMINI_API_KEY':
        if (!secret.startsWith('AIza')) {
          throw new Error('Invalid Gemini API key format');
        }
        break;
      default:
        // Generic validation
        if (secret.length < 8) {
          throw new Error(`${secretName} is too short (minimum 8 characters)`);
        }
    }
  }

  async updateEnvFile(key, value) {
    const envPath = '.env';
    let content = await fs.readFile(envPath, 'utf-8');

    // Replace existing key or append
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }

    await fs.writeFile(envPath, content, 'utf-8');
    console.log(`Updated .env file: ${key}`);
  }

  generateSecureSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  maskSecret(secret) {
    if (!secret || secret.length < 8) {
      return '****';
    }
    return `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`;
  }

  getRotationHistory(secretName) {
    if (secretName) {
      return this.rotationLog.filter(log => log.secretName === secretName);
    }
    return this.rotationLog;
  }
}

module.exports = SecretManager;
```

### Example 3: Configuration Loader with Fallback

```javascript
// src/core/configLoader.js
const path = require('path');

class ConfigLoader {
  constructor() {
    this.configs = new Map();
  }

  loadEnvironment() {
    // Priority order:
    // 1. Process environment variables
    // 2. .env file
    // 3. Default values from config schema

    const envFile = path.join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);

    // Load environment-specific .env file if exists
    try {
      require('dotenv').config({ path: envFile });
      console.log(`Loaded environment file: ${envFile}`);
    } catch (error) {
      console.log(`No environment file found at ${envFile}, using defaults`);
    }

    // Load base .env file
    require('dotenv').config();

    // Import validated config
    const config = require('./config');

    this.configs.set('environment', config);

    return config;
  }

  loadProviderConfig() {
    const env = this.configs.get('environment');

    const providers = {
      openai: {
        enabled: !!env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_URL,
        apiKey: env.OPENAI_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
      deepseek: {
        enabled: !!env.DEEPSEEK_API_KEY,
        baseUrl: env.DEEPSEEK_URL,
        apiKey: env.DEEPSEEK_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
      gemini: {
        enabled: !!env.GEMINI_API_KEY,
        apiKey: env.GEMINI_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
      qwen: {
        enabled: !!env.QWEN_API_KEY,
        baseUrl: env.QWEN_URL,
        apiKey: env.QWEN_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
      grok: {
        enabled: !!env.GROK_API_KEY,
        baseUrl: env.GROK_URL,
        apiKey: env.GROK_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
      llamacpp: {
        enabled: !!env.LLAMACPP_URL,
        baseUrl: env.LLAMACPP_URL,
        apiKey: env.LLAMACPP_API_KEY,
        timeout: env.CHATAVG_PROVIDER_TIMEOUT,
      },
    };

    this.configs.set('providers', providers);

    // Log provider status
    Object.entries(providers).forEach(([name, config]) => {
      console.log(`Provider ${name}: ${config.enabled ? 'enabled' : 'disabled'}`);
    });

    return providers;
  }

  loadSecurityConfig() {
    const env = this.configs.get('environment');

    const security = {
      jwt: {
        secret: env.CHATAVG_SECRET,
        expiresIn: env.CHATAVG_TOKEN_EXPIRY,
      },
      cors: {
        origins: env.CHATAVG_ALLOWED_ORIGINS.split(',').map(o => o.trim()),
      },
      timeouts: {
        provider: env.CHATAVG_PROVIDER_TIMEOUT,
        test: env.CHATAVG_TEST_TIMEOUT,
      },
    };

    this.configs.set('security', security);
    return security;
  }

  getAllConfigs() {
    return Object.fromEntries(this.configs);
  }

  validateConfigIntegrity() {
    const errors = [];

    // Check required secrets
    const env = this.configs.get('environment');
    if (!env.CHATAVG_SECRET) {
      errors.push('CHATAVG_SECRET is required');
    }

    // Check at least one provider is configured
    const providers = this.configs.get('providers');
    const enabledProviders = Object.values(providers).filter(p => p.enabled);
    if (enabledProviders.length === 0) {
      errors.push('At least one AI provider must be configured');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    console.log('Configuration integrity validated');
    return true;
  }
}

module.exports = ConfigLoader;
```

### Example 4: Secure Logging (Preventing Secret Leakage)

```javascript
// src/utils/secureLogger.js
class SecureLogger {
  constructor(config) {
    this.sensitiveKeys = [
      'api_key',
      'apikey',
      'secret',
      'password',
      'token',
      'authorization',
      'access_token',
      'refresh_token',
    ];
    this.maskedValue = '***REDACTED***';
  }

  sanitize(obj, depth = 0) {
    if (depth > 5) {
      return '[Max Depth Exceeded]';
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Check if string looks like a secret (API key pattern)
      if (this.isLikelySecret(obj)) {
        return this.maskedValue;
      }
      return obj;
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item, depth + 1));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key matches sensitive patterns
      if (this.sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = this.maskedValue;
      } else {
        sanitized[key] = this.sanitize(value, depth + 1);
      }
    }

    return sanitized;
  }

  isLikelySecret(value) {
    // Common API key patterns
    const patterns = [
      /^sk-[a-zA-Z0-9]{20,}$/,  // OpenAI-style
      /^AIza[a-zA-Z0-9]{20,}$/, // Google-style
      /^[a-f0-9]{32,}$/,        // Hex-encoded secrets
    ];

    return patterns.some(pattern => pattern.test(value));
  }

  info(message, data = {}) {
    console.log(`[INFO] ${message}`, this.sanitize(data));
  }

  warn(message, data = {}) {
    console.warn(`[WARN] ${message}`, this.sanitize(data));
  }

  error(message, data = {}) {
    console.error(`[ERROR] ${message}`, this.sanitize(data));
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, this.sanitize(data));
    }
  }

  // Safe request logging for debugging
  logRequest(request) {
    const safeRequest = {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitize(request.body),
    };

    this.info('Incoming request', safeRequest);
  }

  sanitizeHeaders(headers) {
    if (!headers) return {};

    const safe = { ...headers };

    // Remove or mask sensitive headers
    if (safe.authorization) {
      safe.authorization = 'Bearer ***REDACTED***';
    }
    if (safe['x-api-key']) {
      safe['x-api-key'] = this.maskedValue;
    }

    return safe;
  }
}

module.exports = new SecureLogger();
```
