/**
 * Routes: Chat Completions
 * POST /api/chat/completions
 * Delegates to the provider adapter configured for the user's category.
 */
const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../lib/auth');
const { asyncHandler } = require('../lib/errors');
const chatService = require('../services/chatService');

const router = Router();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().min(0).max(100_000).nullable().optional(),
  name: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
  tool_call_id: z.string().optional(),
});

const chatCompletionSchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  stream: z.boolean().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  extra_params: z.record(z.any()).optional(),
});

router.post('/completions', authenticate, asyncHandler(async (req, res) => {
  const parseResult = chatCompletionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Неверный формат запроса', details: parseResult.error.errors });
  }

  await chatService.handleCompletion({
    user: req.user,
    body: parseResult.data,
    res,
  });
}));

module.exports = router;
