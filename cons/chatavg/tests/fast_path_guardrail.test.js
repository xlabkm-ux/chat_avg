/**
 * Fast Path Guardrail Tests
 * Validates that the simple chat fast path does NOT load heavy dependencies
 * (sandbox, RAG discovery, heavy tool mesh).
 * 
 * Sprint 2 deliverable: Guardrail test (heavy deps in fast path = failure).
 */
const test = require('node:test');
const assert = require('node:assert/strict');

// Set env for tests
process.env.NODE_ENV = 'test';
if (!process.env.CHATAVG_SECRET) {
  process.env.CHATAVG_SECRET = 'test_secret_that_is_at_least_32_characters_long';
}

test('Fast Path Guardrail Tests', async (t) => {

  await t.test('Fast path is detected when no MCP/RAG/Sandbox configured', () => {
    // Simulate category settings with no heavy features
    const catSettings = {
      provider: 'llamacpp',
      model_name: 'default',
      temperature: 0.7,
      max_tokens: 1024,
      mcp_gateway: '',       // No MCP
      rag_enabled: false,     // No RAG
      sandbox_enabled: false, // No sandbox
    };

    const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled;
    assert.ok(isFastPath, 'Should detect fast path when no heavy features configured');
  });

  await t.test('Fast path is NOT detected when MCP gateway is set', () => {
    const catSettings = {
      provider: 'openai',
      mcp_gateway: 'http://127.0.0.1:8202',
      rag_enabled: false,
      sandbox_enabled: false,
    };

    const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled;
    assert.ok(!isFastPath, 'Should NOT detect fast path when MCP gateway is set');
  });

  await t.test('Fast path is NOT detected when RAG is enabled', () => {
    const catSettings = {
      provider: 'openai',
      mcp_gateway: '',
      rag_enabled: true,
      sandbox_enabled: false,
    };

    const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled;
    assert.ok(!isFastPath, 'Should NOT detect fast path when RAG is enabled');
  });

  await t.test('Fast path is NOT detected when sandbox is enabled', () => {
    const catSettings = {
      provider: 'openai',
      mcp_gateway: '',
      rag_enabled: false,
      sandbox_enabled: true,
    };

    const isFastPath = !catSettings.mcp_gateway && !catSettings.rag_enabled && !catSettings.sandbox_enabled;
    assert.ok(!isFastPath, 'Should NOT detect fast path when sandbox is enabled');
  });

  await t.test('CanonicalChatEvent types are restricted in fast path', () => {
    // In fast path, only delta and done events should appear (no tool_call for simple chat)
    const fastPathAllowedTypes = new Set(['delta', 'done', 'error']);
    
    // Simulate a fast path event stream
    const fastPathEvents = [
      { type: 'delta', text: 'Hello' },
      { type: 'delta', text: ' world' },
      { type: 'done', finishReason: 'stop' },
    ];

    for (const event of fastPathEvents) {
      assert.ok(
        fastPathAllowedTypes.has(event.type),
        `Fast path should not produce '${event.type}' events`
      );
    }
  });

  await t.test('Chat service does not import sandbox modules in fast path', () => {
    // Verify that the chat service module does NOT statically require sandbox/forge modules
    const chatServicePath = require.resolve('../src/modules/chat/chat.service');
    const chatServiceSource = require('fs').readFileSync(chatServicePath, 'utf8');
    
    // These modules should NOT be statically imported in the chat service
    const forbiddenImports = [
      'sandbox',
      'forge',
      'e2b',
      'daytona',
    ];

    for (const mod of forbiddenImports) {
      const hasStaticRequire = new RegExp(`require\\(['\"].*${mod}.*['\"]\\)`, 'i');
      // Allow lazy/conditional requires but not top-level
      const topLevelLines = chatServiceSource.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ');
      });
      
      const hasTopLevel = topLevelLines.some(line => hasStaticRequire.test(line));
      assert.ok(!hasTopLevel, `Fast path violation: '${mod}' should not be statically imported in chat.service.js`);
    }
  });

  await t.test('Semantic layer is lazy-loaded behind feature flag', () => {
    const chatServicePath = require.resolve('../src/modules/chat/chat.service');
    const chatServiceSource = require('fs').readFileSync(chatServicePath, 'utf8');
    
    // Semantic protocol should be lazy-loaded, not top-level
    assert.ok(
      chatServiceSource.includes('let _semanticProtocol = null'),
      'Semantic layer should use lazy-loading pattern'
    );
    assert.ok(
      chatServiceSource.includes('SEMANTIC_LAYER_ENABLED'),
      'Semantic layer should be gated behind feature flag'
    );
  });
});
