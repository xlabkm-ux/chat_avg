/**
 * Routes: Authentication
 * POST /api/auth/login
 */
const { Router } = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { signToken, isExpired } = require('../lib/auth');
const userRepository = require('../storage/userRepository');
const { asyncHandler } = require('../lib/errors');
const { z } = require('zod');

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

router.post('/login', asyncHandler(async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
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
    return res.status(401).json({ detail: 'Неверный логин или пароль' });
  }
  if (isExpired(user)) {
    return res.status(403).json({ detail: 'Срок действия аккаунта истек' });
  }

  const token = signToken(user);
  res.json({ 
    access_token: token, 
    token_type: 'bearer',
    must_change_password: !!user.must_change_password
  });
}));

module.exports = router;
