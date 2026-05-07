"use strict";
const bcrypt = require('bcryptjs');
const db = require('../../core/sqlite');
class UserRepository {
    async findByUsername(username) {
        const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!row)
            return null;
        return { ...row, must_change_password: !!row.must_change_password };
    }
    async save(username, user) {
        db.prepare(`
      INSERT INTO users (username, password_hash, category, expiration_date, n_ctx, system_prompt, email, must_change_password, token_version)
      VALUES (@username, @password_hash, @category, @expiration_date, @n_ctx, @system_prompt, @email, @must_change_password, 0)
      ON CONFLICT(username) DO UPDATE SET
        password_hash=excluded.password_hash,
        category=excluded.category,
        expiration_date=excluded.expiration_date,
        n_ctx=excluded.n_ctx,
        system_prompt=excluded.system_prompt,
        email=excluded.email,
        must_change_password=excluded.must_change_password,
        token_version = CASE WHEN users.password_hash != excluded.password_hash THEN users.token_version + 1 ELSE users.token_version END
    `).run({
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
    async delete(username) {
        const info = db.prepare('DELETE FROM users WHERE username = ?').run(username);
        return info.changes > 0;
    }
    async listAll() {
        const rows = db.prepare('SELECT * FROM users').all();
        const result = {};
        for (const row of rows) {
            result[row.username] = { ...row, must_change_password: !!row.must_change_password };
        }
        return result;
    }
    async countActive() {
        const rows = db.prepare('SELECT expiration_date FROM users WHERE expiration_date IS NOT NULL').all();
        return rows.filter(r => new Date(r.expiration_date) > new Date()).length;
    }
    async countExpired() {
        const rows = db.prepare('SELECT expiration_date FROM users WHERE expiration_date IS NOT NULL').all();
        return rows.filter(r => new Date(r.expiration_date) < new Date()).length;
    }
    async countTotal() {
        return db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
}
module.exports = new UserRepository();
//# sourceMappingURL=user.repository.js.map