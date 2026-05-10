const db = require('../../core/sqlite');
const crypto = require('../../core/crypto');

class CategoryRepository {
  async findByName(name) {
    const row = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    if (!row) return null;
    return { 
      ...row, 
      api_key: crypto.decrypt(row.api_key),
      extra_params: row.extra_params ? JSON.parse(row.extra_params) : undefined,
      debug_mode: !!row.debug_mode
    };
  }

  async save(name, category) {
    const params = category.extra_params || {};
    db.prepare(`
      INSERT INTO categories (name, provider, endpoint_url, model_name, api_key, temperature, top_p, top_k, min_p, repeat_penalty, max_tokens, system_prompt, extra_params, routing_mode, fallback_provider, mcp_gateway, debug_mode)
      VALUES (@name, @provider, @endpoint_url, @model_name, @api_key, @temperature, @top_p, @top_k, @min_p, @repeat_penalty, @max_tokens, @system_prompt, @extra_params, @routing_mode, @fallback_provider, @mcp_gateway, @debug_mode)
      ON CONFLICT(name) DO UPDATE SET
        provider=excluded.provider,
        endpoint_url=excluded.endpoint_url,
        model_name=excluded.model_name,
        api_key=excluded.api_key,
        temperature=excluded.temperature,
        top_p=excluded.top_p,
        top_k=excluded.top_k,
        min_p=excluded.min_p,
        repeat_penalty=excluded.repeat_penalty,
        max_tokens=excluded.max_tokens,
        system_prompt=excluded.system_prompt,
        extra_params=excluded.extra_params,
        routing_mode=excluded.routing_mode,
        fallback_provider=excluded.fallback_provider,
        mcp_gateway=excluded.mcp_gateway,
        debug_mode=excluded.debug_mode
    `).run({
      name,
      provider: category.provider || null,
      endpoint_url: params.endpoint_url || category.endpoint_url || null,
      model_name: category.model_name || null,
      api_key: crypto.encrypt(params.api_key || category.api_key) || null,
      temperature: params.temperature !== undefined ? params.temperature : (category.temperature !== undefined ? category.temperature : null),
      top_p: params.top_p !== undefined ? params.top_p : (category.top_p !== undefined ? category.top_p : null),
      top_k: params.top_k !== undefined ? params.top_k : (category.top_k !== undefined ? category.top_k : null),
      min_p: params.min_p !== undefined ? params.min_p : (category.min_p !== undefined ? category.min_p : null),
      repeat_penalty: params.repeat_penalty !== undefined ? params.repeat_penalty : (category.repeat_penalty !== undefined ? category.repeat_penalty : null),
      max_tokens: params.max_tokens !== undefined ? params.max_tokens : (category.max_tokens !== undefined ? category.max_tokens : null),
      system_prompt: category.system_prompt || null,
      extra_params: category.extra_params ? JSON.stringify(category.extra_params) : null,
      routing_mode: category.routing_mode || 'direct',
      fallback_provider: category.fallback_provider || null,
      mcp_gateway: params.mcp_gateway || category.mcp_gateway || null,
      debug_mode: category.debug_mode ? 1 : 0
    });
  }

  async listAll() {
    const rows = db.prepare('SELECT * FROM categories').all();
    const result = {};
    for (const row of rows) {
      result[row.name] = { 
        ...row, 
        api_key: crypto.decrypt(row.api_key),
        extra_params: row.extra_params ? JSON.parse(row.extra_params) : undefined,
        debug_mode: !!row.debug_mode
      };
    }
    return result;
  }

  async countTotal() {
    return db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  }
}

module.exports = new CategoryRepository();
