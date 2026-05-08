/**
 * Routes: Chat Completions
 * POST /api/chat/completions
 * Delegates to the provider adapter configured for the user's category.
 */
const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../auth/auth.middleware');
const { asyncHandler } = require('../../core/errors');
const chatController = require('./chat.controller');

const router = Router();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.preprocess((val) => (typeof val === 'string' ? val.trim() : val), 
    z.string().max(100_000).nullable().optional()
  ),
  name: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
  tool_call_id: z.string().optional(),
}).refine(m => {
  // Tool messages must have a tool_call_id
  if (m.role === 'tool' && !m.tool_call_id) return false;
  // User messages must have some content or be part of a tool flow (unlikely for user but possible in some APIs)
  if (m.role === 'user' && (!m.content || m.content.length === 0)) return false;
  return true;
}, { message: "Invalid message structure for the specified role" });

const chatCompletionSchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  stream: z.boolean().optional().nullable().default(false),
  temperature: z.number().min(0).max(2).optional().nullable(),
  top_p: z.number().min(0).max(1).optional().nullable(),
  top_k: z.number().int().min(0).max(100).optional().nullable(),
  min_p: z.number().min(0).max(1).optional().nullable(),
  repeat_penalty: z.number().min(0).max(2).optional().nullable(),
  n_predict: z.number().int().positive().optional().nullable(),
  extra_params: z.record(z.any()).optional().nullable(),
  run_id: z.string().optional().nullable(),
  runId: z.string().optional().nullable(),
}).refine(data => {
  const lastMsg = data.messages[data.messages.length - 1];
  return lastMsg.role !== 'system';
}, { message: "The last message cannot be a system message" });

router.post('/completions', authenticate, asyncHandler(async (req, res) => {
  const parseResult = chatCompletionSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.error('[Chat] Validation failed:', parseResult.error.format());
    return res.status(400).json({ error: 'Неверный формат запроса', details: parseResult.error.errors });
  }

  await chatController.handleCompletion(req, res);
}));

module.exports = router;
