const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { spawnSync } = require('child_process');

// Path to the server and config
const PROJECT_ROOT = path.resolve(__dirname, '../../');

/**
 * These tests verify the "Production Safety Hardening" requirements.
 * Since many of these require process.exit(1) on boot, we test them by spawning the server process.
 */

test('Production Boot: Fails if CHATAVG_ADMIN_PASSWORD is missing', async (t) => {
  const result = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'src/core/config.js')], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CHATAVG_SECRET: 'a'.repeat(32),
      CHATAVG_ADMIN_PASSWORD: '', // Missing
    }
  });

  if (result.status === null) console.log('DEBUG: spawnSync error:', result.error);
  const output = (result.stderr?.toString() || '') + (result.stdout?.toString() || '');
  assert.strictEqual(result.status, 1, 'Process should exit with code 1');
  assert.ok(output.includes('CHATAVG_ADMIN_PASSWORD is required in production mode'), 'Error message should be present');
});

test('Production Boot: Fails if SANDBOX_FORGE_ENABLED=true but E2B_API_KEY is missing', async (t) => {
  const result = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'src/core/config.js')], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CHATAVG_SECRET: 'a'.repeat(32),
      CHATAVG_ADMIN_PASSWORD: 'some_strong_password_12345678',
      SANDBOX_FORGE_ENABLED: 'true',
      E2B_API_KEY: '', // Missing
    }
  });

  if (result.status === null) console.log('DEBUG: spawnSync error:', result.error);
  const output = (result.stderr?.toString() || '') + (result.stdout?.toString() || '');
  assert.strictEqual(result.status, 1, 'Process should exit with code 1');
  assert.ok(output.includes('E2B_API_KEY is missing'), 'Error message should be present');
});

test('Production Boot: Allowed if all required keys are present', async (t) => {
  const result = spawnSync(process.execPath, ['-e', 'require("./src/core/config.js"); console.log("OK")'], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CHATAVG_SECRET: 'a'.repeat(32),
      CHATAVG_ADMIN_PASSWORD: 'some_strong_password_12345678',
      SANDBOX_FORGE_ENABLED: 'true',
      E2B_API_KEY: 'e2b_test_key',
    }
  });

  if (result.status === null) console.log('DEBUG: spawnSync error:', result.error);
  const output = (result.stdout?.toString() || '').trim();
  assert.strictEqual(result.status, 0, 'Process should exit with code 0');
  assert.ok(output.includes('OK'), 'Output should contain OK');
});

test('Sandbox Manager: Prohibits LocalAdapter in production', async (t) => {
    const script = `
        process.env.NODE_ENV = 'production';
        process.env.E2B_API_KEY = ''; // Missing
        const { SandboxManager } = require('./src/modules/sandbox/sandbox.manager');
        const { SandboxAdapter } = require('./src/modules/sandbox/sandbox.types');
        const manager = new SandboxManager({ enabled: true });
        try {
            manager._selectAdapter();
            console.log('FAIL: LocalAdapter was allowed');
            process.exit(1);
        } catch (err) {
            if (err.message.includes('LocalAdapter is prohibited in production')) {
                console.log('SUCCESS');
            } else {
                console.log('FAIL: Wrong error message: ' + err.message);
                process.exit(1);
            }
        }
    `;

    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, NODE_ENV: 'production', E2B_API_KEY: '' }
    });

    if (result.status === null) console.log('DEBUG: spawnSync error:', result.error);
  const output = (result.stdout?.toString() || '').trim();
    assert.strictEqual(output, 'SUCCESS', 'LocalAdapter should be prohibited');
});
