const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { DATA_DIR, USERS_FILE, CATEGORIES_FILE, SESSIONS_ROOT } = require('../config');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
// Foreign keys
db.pragma('foreign_keys = ON');

// Define schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    category TEXT,
    expiration_date TEXT,
    n_ctx INTEGER,
    system_prompt TEXT,
    email TEXT,
    must_change_password BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS categories (
    name TEXT PRIMARY KEY,
    provider TEXT,
    endpoint_url TEXT,
    model_name TEXT,
    api_key TEXT,
    temperature REAL,
    top_p REAL,
    top_k INTEGER,
    min_p REAL,
    repeat_penalty REAL,
    max_tokens INTEGER,
    system_prompt TEXT,
    extra_params TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT NOT NULL,
    username TEXT NOT NULL,
    title TEXT,
    messages TEXT,
    updatedAt INTEGER,
    PRIMARY KEY (id, username),
    FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE
  );
`);

// Initialization & Migration
function initDatabase() {
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (checkUsers.count > 0) return; // Already migrated or populated

  const { DEFAULT_CATEGORY_PARAMS, DEFAULT_SYSTEM_PROMPT } = require('../config');
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');

  const migrateCategory = db.prepare(`
    INSERT INTO categories (name, provider, endpoint_url, model_name, api_key, temperature, top_p, top_k, min_p, repeat_penalty, max_tokens, system_prompt, extra_params)
    VALUES (@name, @provider, @endpoint_url, @model_name, @api_key, @temperature, @top_p, @top_k, @min_p, @repeat_penalty, @max_tokens, @system_prompt, @extra_params)
  `);

  const migrateUser = db.prepare(`
    INSERT INTO users (username, password_hash, category, expiration_date, n_ctx, system_prompt, email, must_change_password)
    VALUES (@username, @password_hash, @category, @expiration_date, @n_ctx, @system_prompt, @email, @must_change_password)
  `);

  const migrateSession = db.prepare(`
    INSERT INTO sessions (id, username, title, messages, updatedAt)
    VALUES (@id, @username, @title, @messages, @updatedAt)
  `);

  db.transaction(() => {
    // If JSON files exist, perform migration
    if (fs.existsSync(USERS_FILE) || fs.existsSync(CATEGORIES_FILE)) {
      console.log('[SQLite] Starting migration from JSON to SQLite...');
    // 1. Categories
    if (fs.existsSync(CATEGORIES_FILE)) {
      const cats = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
      for (const [name, cat] of Object.entries(cats)) {
        migrateCategory.run({
          name,
          provider: cat.provider || null,
          endpoint_url: cat.endpoint_url || null,
          model_name: cat.model_name || null,
          api_key: cat.api_key || null,
          temperature: cat.temperature !== undefined ? cat.temperature : null,
          top_p: cat.top_p !== undefined ? cat.top_p : null,
          top_k: cat.top_k !== undefined ? cat.top_k : null,
          min_p: cat.min_p !== undefined ? cat.min_p : null,
          repeat_penalty: cat.repeat_penalty !== undefined ? cat.repeat_penalty : null,
          max_tokens: cat.max_tokens !== undefined ? cat.max_tokens : null,
          system_prompt: cat.system_prompt || null,
          extra_params: cat.extra_params ? JSON.stringify(cat.extra_params) : null,
        });
      }
    }

    // 2. Users
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      for (const [username, user] of Object.entries(users)) {
        migrateUser.run({
          username,
          password_hash: user.password_hash,
          category: user.category || null,
          expiration_date: user.expiration_date || null,
          n_ctx: user.n_ctx || null,
          system_prompt: user.system_prompt || null,
          email: user.email || null,
          must_change_password: user.must_change_password ? 1 : 0,
        });
      }
    }

    // 3. Sessions
    if (fs.existsSync(SESSIONS_ROOT)) {
      const userDirs = fs.readdirSync(SESSIONS_ROOT);
      for (const userDir of userDirs) {
        const dirPath = path.join(SESSIONS_ROOT, userDir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
          for (const f of files) {
            try {
              const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf8'));
              migrateSession.run({
                id: data.id,
                username: userDir,
                title: data.title || 'Новый чат',
                messages: JSON.stringify(data.messages || []),
                updatedAt: data.updatedAt || Date.now(),
              });
            } catch (e) {
              console.error(`[SQLite] Failed to migrate session ${f} for user ${userDir}`, e);
            }
          }
        }
      }
    }
      console.log('[SQLite] Migration completed successfully.');
    } else {
      // Clean install: seed default data
      console.log('[SQLite] Initializing clean database...');
      
      const defaultCategories = ['Администратор', 'Консультант', 'Эксперт', 'Мудрец'];
      for (const name of defaultCategories) {
        migrateCategory.run({
          name,
          provider: DEFAULT_CATEGORY_PARAMS.provider,
          endpoint_url: DEFAULT_CATEGORY_PARAMS.endpoint_url,
          model_name: DEFAULT_CATEGORY_PARAMS.model_name || null,
          api_key: DEFAULT_CATEGORY_PARAMS.api_key || null,
          temperature: DEFAULT_CATEGORY_PARAMS.temperature,
          top_p: DEFAULT_CATEGORY_PARAMS.top_p,
          top_k: DEFAULT_CATEGORY_PARAMS.top_k,
          min_p: DEFAULT_CATEGORY_PARAMS.min_p,
          repeat_penalty: DEFAULT_CATEGORY_PARAMS.repeat_penalty,
          max_tokens: DEFAULT_CATEGORY_PARAMS.max_tokens,
          system_prompt: DEFAULT_CATEGORY_PARAMS.system_prompt || null,
          extra_params: null,
        });
      }

      const adminPass = process.env.CHATAVG_ADMIN_PASSWORD;
      const finalAdminPass = adminPass || crypto.randomBytes(16).toString('hex');
      
      if (!adminPass) {
        console.log(`\n======================================================\n`);
        console.log(`  GENERATED ADMIN PASSWORD: ${finalAdminPass}`);
        console.log(`  Please save it and change it immediately upon login!`);
        console.log(`\n======================================================\n`);
      }

      migrateUser.run({
        username: 'admin',
        password_hash: bcrypt.hashSync(finalAdminPass, 10),
        category: 'Администратор',
        expiration_date: '2099-12-31',
        n_ctx: 4096,
        system_prompt: DEFAULT_SYSTEM_PROMPT,
        email: null,
        must_change_password: 1,
      });
      console.log('[SQLite] Default initialization completed.');
    }
  })();
}

initDatabase();

module.exports = db;
