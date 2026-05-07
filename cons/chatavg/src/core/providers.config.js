const { providerEnv } = require('./config');

/**
 * Конфигурация провайдеров и моделей.
 */
const providersConfig = {
  "llamacpp": {
    "name": "Локальная LLM (Llama.cpp)",
    "adapter": "llamacpp",
    "endpoint_url": providerEnv.LLAMACPP_URL || "http://127.0.0.1:8201",
    "api_key": providerEnv.LLAMACPP_API_KEY || "",
    "extra_params": {},
    "models": {
      "default": { "name": "Модель по умолчанию", "extra_params": {} }
    }
  },
  "openai": {
    "name": "OpenAI API",
    "adapter": "openai",
    "endpoint_url": providerEnv.OPENAI_URL || "https://api.openai.com/v1",
    "api_key": providerEnv.OPENAI_API_KEY || "",
    "extra_params": {},
    "models": {
      "gpt-4.1": { "name": "GPT-4.1", "extra_params": {} },
      "gpt-4.1-mini": { "name": "GPT-4.1 Mini", "extra_params": {} },
      "gpt-4o": { "name": "GPT-4 Omni", "extra_params": {} },
      "gpt-4o-mini": { "name": "GPT-4 Omni Mini", "extra_params": {} }
    }
  },
  "openai_responses": {
    "name": "OpenAI Responses API",
    "adapter": "openai_responses",
    "endpoint_url": providerEnv.OPENAI_URL || "https://api.openai.com/v1",
    "api_key": providerEnv.OPENAI_API_KEY || "",
    "extra_params": {},
    "models": {
      "gpt-4.1": { "name": "GPT-4.1", "extra_params": {} },
      "gpt-4o": { "name": "GPT-4 Omni", "extra_params": {} }
    }
  },
  "deepseek": {
    "name": "DeepSeek",
    "adapter": "deepseek",
    "endpoint_url": providerEnv.DEEPSEEK_URL || "https://api.deepseek.com/v1",
    "api_key": providerEnv.DEEPSEEK_API_KEY || "",
    "extra_params": {},
    "models": {
      "deepseek-chat": { "name": "DeepSeek Chat", "extra_params": {} },
      "deepseek-reasoner": { "name": "DeepSeek Reasoner", "extra_params": {} }
    }
  },
  "google": {
    "name": "Google Gemini",
    "adapter": "google",
    "endpoint_url": "",
    "api_key": providerEnv.GEMINI_API_KEY || "",
    "extra_params": {},
    "models": {
      "gemini-2.5-flash": { "name": "Gemini 2.5 Flash", "extra_params": {} },
      "gemini-2.5-pro": { "name": "Gemini 2.5 Pro", "extra_params": {} }
    }
  },
  "qwen": {
    "name": "Qwen (DashScope)",
    "adapter": "qwen",
    "endpoint_url": providerEnv.QWEN_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    "api_key": providerEnv.QWEN_API_KEY || "",
    "extra_params": {},
    "models": {
      "qwen-plus": { "name": "Qwen Plus", "extra_params": {} },
      "qwen-turbo": { "name": "Qwen Turbo", "extra_params": {} }
    }
  },
  "grok": {
    "name": "Grok (xAI)",
    "adapter": "grok",
    "endpoint_url": providerEnv.GROK_URL || "https://api.x.ai/v1",
    "api_key": providerEnv.GROK_API_KEY || "",
    "extra_params": {
      "collection_ids": ["collection_82226a3f-f5b0-4a74-a818-55f7b3e71fdc"]
    },
    "models": {
      "grok-4-1-fast-non-reasoning": { "name": "Grok 4.1 Fast (Non-reasoning)", "extra_params": {} },
      "grok-3": { "name": "Grok 3", "extra_params": {} },
      "grok-2": { "name": "Grok 2", "extra_params": {} }
    }
  },
  "mcp": {
    "name": "MCP Gateway",
    "adapter": "mcp",
    "endpoint_url": providerEnv.MCP_GATEWAY_URL || "http://127.0.0.1:8202",
    "api_key": providerEnv.MCP_API_KEY || "",
    "extra_params": {},
    "models": {
      "default": { "name": "Модель по умолчанию", "extra_params": {} }
    }
  }
};

module.exports = providersConfig;
