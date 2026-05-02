/**
 * Routes: Authentication
 * POST /api/auth/login
 */
const { Router } = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { signToken, isExpired } = require('./auth.middleware');
const userRepository = require('./user.repository');
const { asyncHandler } = require('../../core/errors');
const { z } = require('zod');

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

const AuditService = require('../audit/audit.service');

router.post('/login', asyncHandler(async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    AuditService.log(null, 'LOGIN_FAILED', { reason: 'invalid_format' }, ip);
    return res.status(400).json({ detail: 'Логин и пароль обязательны и должны быть корректного формата' });
  }
  const { username, password } = parseResult.data;

  const user = await userRepository.findByUsername(username);

  let isValid = false;
  if (user && user.password_hash) {
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      isValid = bcrypt.compareSync(password, user.password_hash);
    } else if (user.password_hash.length === 64) {
      const oldHash = crypto.createHash('sha256').update(password).digest('hex');
      if (oldHash === user.password_hash) {
        isValid = true;
        user.password_hash = await userRepository.hashPassword(password);
        await userRepository.save(username, user);
      }
    }
  }

  if (!isValid) {
    AuditService.log(username, 'LOGIN_FAILED', { reason: 'invalid_credentials' }, ip);
    return res.status(401).json({ detail: 'Неверный логин или пароль' });
  }
  if (isExpired(user)) {
    AuditService.log(username, 'LOGIN_FAILED', { reason: 'account_expired' }, ip);
    return res.status(403).json({ detail: 'Срок действия аккаунта истек' });
  }

  const token = signToken(user);
  AuditService.log(username, 'LOGIN', null, ip);
  
  res.json({ 
    access_token: token, 
    token_type: 'bearer',
    must_change_password: !!user.must_change_password
  });
}));

module.exports = router;
