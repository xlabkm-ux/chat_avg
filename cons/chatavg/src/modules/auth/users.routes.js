/**
 * Routes: User Profile
 * GET  /api/users/me
 * PATCH /api/users/me
 */
const { Router } = require('express');
const userRepository = require('./user.repository');
const { authenticate } = require('./auth.middleware');
const { asyncHandler } = require('../../core/errors');
const { z } = require('zod');

const router = Router();

router.get('/me', authenticate, (req, res) => {
  const u = { ...req.user };
  delete u.password_hash;
  res.json(u);
});

const userPatchSchema = z.object({
  email: z.string().email().max(254).optional().or(z.literal('')),
  password: z.string().min(8).max(128).optional(),
}).strict();

router.patch('/me', authenticate, asyncHandler(async (req, res) => {
  const { username } = req.user;
  
  const parseResult = userPatchSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ detail: 'Некорректный формат данных', errors: parseResult.error.issues });
  }

  const { password, email } = parseResult.data;

  const user = await userRepository.findByUsername(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (password) {
    user.password_hash = await userRepository.hashPassword(password);
    user.must_change_password = false;
  }
  if (email !== undefined) user.email = email;

  await userRepository.save(username, user);
  res.json({ status: 'success' });
}));

module.exports = router;
