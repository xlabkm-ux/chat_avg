const db = require('../lib/sqlite');

class CategoryRepository {
  async findByName(name) {
    const row = db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    if (!row) return null;
    return { ...row, extra_params: row.extra_params ? JSON.parse(row.extra_params) : undefined };
  }

  async save(name, category) {
    db.prepare(`
      INSERT INTO categories (name, provider, endpoint_url, model_name, api_key, temperature, top_p, top_k, min_p, repeat_penalty, max_tokens, system_prompt, extra_params)
      VALUES (@name, @provider, @endpoint_url, @model_name, @api_key, @temperature, @top_p, @top_k, @min_p, @repeat_penalty, @max_tokens, @system_prompt, @extra_params)
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
        extra_params=excluded.extra_params
    `).run({
      name,
      provider: category.provider || null,
      endpoint_url: category.endpoint_url || null,
      model_name: category.model_name || null,
      api_key: category.api_key || null,
      temperature: category.temperature !== undefined ? category.temperature : null,
      top_p: category.top_p !== undefined ? category.top_p : null,
      top_k: category.top_k !== undefined ? category.top_k : null,
      min_p: category.min_p !== undefined ? category.min_p : null,
      repeat_penalty: category.repeat_penalty !== undefined ? category.repeat_penalty : null,
      max_tokens: category.max_tokens !== undefined ? category.max_tokens : null,
      system_prompt: category.system_prompt || null,
      extra_params: category.extra_params ? JSON.stringify(category.extra_params) : null,
    });
  }

  async listAll() {
    const rows = db.prepare('SELECT * FROM categories').all();
    const result = {};
    for (const row of rows) {
      result[row.name] = { ...row, extra_params: row.extra_params ? JSON.parse(row.extra_params) : undefined };
    }
    return result;
  }

  async countTotal() {
    return db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  }
}

module.exports = new CategoryRepository();
