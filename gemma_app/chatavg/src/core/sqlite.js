const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { DATA_DIR } = require('./config');

/**
 * Database Initialization
 */

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'database.sqlite');
const db = new Database(dbPath);

// Performance & Safety Pragma
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Migration System
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL
  );
`);

const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          username TEXT PRIMARY KEY,
          password_hash TEXT NOT NULL,
          category TEXT,
          expiration_date TEXT,
          n_ctx INTEGER,
          system_prompt TEXT,
          email TEXT,
          must_change_password BOOLEAN,
          token_version INTEGER DEFAULT 0
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
    }
  },
  {
    version: 2,
    name: 'add_audit_logs',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (username) REFERENCES users (username) ON DELETE SET NULL
        );
      `);
    }
  }
];

function runMigrations() {
  db.exec('BEGIN EXCLUSIVE TRANSACTION');
  try {
    const currentVersionRow = db.prepare('SELECT MAX(version) as v FROM migrations').get();
    const currentVersion = currentVersionRow?.v || 0;

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        console.log(`[SQLite] Applying migration ${migration.version}: ${migration.name}`);
        migration.up(db);
        db.prepare('INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          migration.version,
          migration.name,
          Date.now()
        );
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[SQLite] Migration failed:', error);
    throw error;
  }
}

runMigrations();

/**
 * Seeding (Clean Install Only)
 */
function seed() {
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (checkUsers.count > 0) return;

  console.log('[SQLite] No users found. Seeding initial data...');
  
  const { DEFAULT_CATEGORY_PARAMS, DEFAULT_SYSTEM_PROMPT } = require('./config');
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');

  db.transaction(() => {
    // 1. Seed Default Categories
    const insertCat = db.prepare(`
      INSERT INTO categories (name, provider, endpoint_url, model_name, api_key, temperature, top_p, top_k, min_p, repeat_penalty, max_tokens, system_prompt)
      VALUES (@name, @provider, @endpoint_url, @model_name, @api_key, @temperature, @top_p, @top_k, @min_p, @repeat_penalty, @max_tokens, @system_prompt)
    `);

    const defaultCategories = ['Администратор', 'Консультант', 'Эксперт', 'Мудрец'];
    for (const name of defaultCategories) {
      insertCat.run({
        name,
        ...DEFAULT_CATEGORY_PARAMS,
        system_prompt: DEFAULT_CATEGORY_PARAMS.system_prompt || null
      });
    }

    // 2. Seed Default Admin
    const adminPass = process.env.CHATAVG_ADMIN_PASSWORD;
    const finalAdminPass = adminPass || crypto.randomBytes(16).toString('hex');
    
    if (!adminPass) {
      console.log(`\n======================================================\n`);
      console.log(`  GENERATED ADMIN PASSWORD: ${finalAdminPass}`);
      console.log(`  Please save it and change it immediately upon login!`);
      console.log(`\n======================================================\n`);
    }

    db.prepare(`
      INSERT INTO users (username, password_hash, category, expiration_date, n_ctx, system_prompt, must_change_password)
      VALUES (@username, @password_hash, @category, @expiration_date, @n_ctx, @system_prompt, @must_change_password)
    `).run({
      username: 'admin',
      password_hash: bcrypt.hashSync(finalAdminPass, 10),
      category: 'Администратор',
      expiration_date: '2099-12-31',
      n_ctx: 4096,
      system_prompt: DEFAULT_SYSTEM_PROMPT,
      must_change_password: 1,
    });
  })();
  
  console.log('[SQLite] Seed completed.');
}

// Auto-seed on first run
seed();

module.exports = db;
