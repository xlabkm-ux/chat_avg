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
  },
  {
    version: 3,
    name: 'add_policy_router_fields',
    up: (txDb) => {
      txDb.exec(`
        ALTER TABLE categories ADD COLUMN routing_mode TEXT DEFAULT 'direct';
        ALTER TABLE categories ADD COLUMN fallback_provider TEXT;
      `);
    }
  },
  {
    version: 4,
    name: 'add_mcp_gateway_field',
    up: (txDb) => {
      txDb.exec(`
        ALTER TABLE categories ADD COLUMN mcp_gateway TEXT;
      `);
    }
  },
  {
    version: 5,
    name: 'add_missions_and_agent_runs',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS missions (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          username TEXT NOT NULL,
          semantic_protocol_id TEXT,
          glossary_version TEXT,
          mode TEXT,
          goal TEXT,
          constraints TEXT,
          open_questions TEXT,
          context TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (session_id, username) REFERENCES sessions (id, username) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS agent_runs (
          id TEXT PRIMARY KEY,
          mission_id TEXT NOT NULL,
          state TEXT NOT NULL,
          metadata TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (mission_id) REFERENCES missions (id) ON DELETE CASCADE
        );
      `);
    }
  },
  {
    version: 6,
    name: 'add_approval_requests',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS approval_requests (
          id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL,
          action_type TEXT NOT NULL,
          payload TEXT,
          risk_score INTEGER,
          reason TEXT,
          state TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (run_id) REFERENCES agent_runs (id) ON DELETE CASCADE
        );
      `);
    }
  },
  {
    version: 7,
    name: 'add_agent_run_events',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS agent_run_events (
          id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          payload TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (run_id) REFERENCES agent_runs (id) ON DELETE CASCADE
        );
      `);
    }
  },
  {
    version: 8,
    name: 'add_idempotency_keys',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          key TEXT PRIMARY KEY,
          response_code INTEGER,
          response_body TEXT,
          created_at INTEGER NOT NULL
        );
      `);
    }
  },
  {
    version: 9,
    name: 'add_semantic_layer_v02',
    up: (txDb) => {
      txDb.exec(`
        CREATE TABLE IF NOT EXISTS domain_boundaries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          level TEXT,
          max_allowed_strength TEXT,
          rules TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS claims (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          username TEXT NOT NULL,
          claim_text TEXT NOT NULL,
          claim_type TEXT NOT NULL,
          reality_level TEXT NOT NULL,
          strength TEXT NOT NULL,
          evidence_basis TEXT,
          source_refs TEXT,
          source_span TEXT,
          domain_boundary_id TEXT,
          allowed_strength TEXT,
          downgraded_from TEXT,
          distortion_risks TEXT,
          requires_user_decision BOOLEAN DEFAULT 0,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id, username) REFERENCES sessions (id, username) ON DELETE CASCADE,
          FOREIGN KEY (domain_boundary_id) REFERENCES domain_boundaries (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS semantic_events (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          username TEXT NOT NULL,
          run_id TEXT,
          event_type TEXT NOT NULL,
          claim_id TEXT,
          payload TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id, username) REFERENCES sessions (id, username) ON DELETE CASCADE,
          FOREIGN KEY (claim_id) REFERENCES claims (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS distortion_hypotheses (
          id TEXT PRIMARY KEY,
          claim_id TEXT NOT NULL,
          hypothesis_text TEXT NOT NULL,
          confidence REAL,
          mitigation_strategy TEXT,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (claim_id) REFERENCES claims (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conflict_cards (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          username TEXT NOT NULL,
          claim_a_id TEXT NOT NULL,
          claim_b_id TEXT NOT NULL,
          conflict_type TEXT NOT NULL,
          resolution_status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY (session_id, username) REFERENCES sessions (id, username) ON DELETE CASCADE,
          FOREIGN KEY (claim_a_id) REFERENCES claims (id) ON DELETE CASCADE,
          FOREIGN KEY (claim_b_id) REFERENCES claims (id) ON DELETE CASCADE
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
      INSERT INTO categories (name, provider, model_name, temperature, top_p, top_k, min_p, repeat_penalty, max_tokens, system_prompt)
      VALUES (@name, @provider, @model_name, @temperature, @top_p, @top_k, @min_p, @repeat_penalty, @max_tokens, @system_prompt)
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
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        console.log(`\n======================================================\n`);
        console.log(`  GENERATED ADMIN PASSWORD: ${finalAdminPass}`);
        console.log(`  Please save it and change it immediately upon login!`);
        console.log(`\n======================================================\n`);
      } else {
        // This should normally be unreachable due to config.js checks
        console.warn('[Security] CHATAVG_ADMIN_PASSWORD was missing in production seed. Password auto-generated but NOT logged.');
      }
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
