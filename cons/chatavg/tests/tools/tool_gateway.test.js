const { test, describe } = require('node:test');
const assert = require('node:assert');
const { ToolRegistry, ToolDefinitionVersion, RiskClass } = require('../../src/modules/tools/tool.registry');
const { ToolGateway, ToolCallState } = require('../../src/modules/tools/tool.gateway');
const { ProviderError } = require('../../src/modules/providers/providerErrors');
const db = require('../../src/core/sqlite');

db.exec('PRAGMA foreign_keys = OFF');

describe('MCP Tool Gateway & Versioned Registry', () => {
  test('ToolRegistry cache key generation and retrieval', () => {
    const registry = new ToolRegistry();
    const def = registry.registerTool({
      providerId: 'mcp-1',
      toolName: 'read_file',
      toolVersion: '1.0.0',
      schema: { type: 'object', properties: { path: { type: 'string' } } },
      riskClass: RiskClass.READ
    });

    assert.ok(def.cacheKey.startsWith('mcp-1:read_file:1.0.0:'));
    assert.strictEqual(registry.getTool(def.cacheKey), def);
  });

  test('ToolRegistry find latest non-canary version', () => {
    const registry = new ToolRegistry();
    registry.registerTool({ providerId: 'mcp-1', toolName: 'test', toolVersion: '1.0.0' });
    registry.registerTool({ providerId: 'mcp-1', toolName: 'test', toolVersion: '1.1.0' });
    registry.registerTool({ providerId: 'mcp-1', toolName: 'test', toolVersion: '2.0.0', isCanary: true });

    const latest = registry.findToolLatest('mcp-1', 'test');
    assert.strictEqual(latest.toolVersion, '1.1.0');
  });

  test('ToolGateway requires idempotencyKey for side-effect tools', async () => {
    const registry = new ToolRegistry();
    const def = registry.registerTool({
      providerId: 'mcp-1',
      toolName: 'write_file',
      toolVersion: '1.0.0',
      riskClass: RiskClass.WRITE
    });

    const gateway = new ToolGateway(registry);

    try {
      await gateway.executeTool(def.cacheKey, { path: 'test.txt' }, 'test-run', null, async () => true);
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.message, 'IdempotencyKey is required for side-effect tools');
      assert.strictEqual(err.code, 'BAD_REQUEST');
    }
  });

  test('ToolGateway execution and state machine', async () => {
    const registry = new ToolRegistry();
    const def = registry.registerTool({
      providerId: 'mcp-1',
      toolName: 'read_file',
      toolVersion: '1.0.0',
      riskClass: RiskClass.READ
    });

    const gateway = new ToolGateway(registry);

    let executed = false;
    const mcpExecutorFn = async (definition, args) => {
      executed = true;
      return { content: 'hello' };
    };

    const call = await gateway.executeTool(def.cacheKey, { path: 'test.txt' }, 'test-run', null, mcpExecutorFn);

    assert.strictEqual(executed, true);
    assert.strictEqual(call.state, ToolCallState.COMPLETED);
    assert.deepStrictEqual(call.result, { content: 'hello' });
  });

  test('ToolGateway timeout handling', async () => {
    const registry = new ToolRegistry();
    const def = registry.registerTool({
      providerId: 'mcp-1',
      toolName: 'slow_tool',
      toolVersion: '1.0.0',
      riskClass: RiskClass.READ,
      timeoutMs: 50 // 50ms timeout
    });

    const gateway = new ToolGateway(registry);

    const mcpExecutorFn = async () => {
      return new Promise(resolve => setTimeout(resolve, 100)); // 100ms execution
    };

    try {
      await gateway.executeTool(def.cacheKey, {}, 'test-run', null, mcpExecutorFn);
      assert.fail('Should have timed out');
    } catch (err) {
      assert.strictEqual(err.message, 'Tool execution timed out');
      assert.strictEqual(err.code, 'TIMEOUT');
    }
  });
});
