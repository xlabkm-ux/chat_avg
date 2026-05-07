const { startAgentRun, signalApproval } = require('../src/modules/temporal/client');

async function testSignal() {
  const runId = process.argv[2];
  const action = process.argv[3] || 'approve';
  
  if (!runId) {
    console.error('Usage: node tests/signal.js <runId> [action]');
    process.exit(1);
  }

  console.log(`Signaling run ${runId} with action: ${action}...`);
  await signalApproval(runId, action);
  console.log('Signal sent successfully.');
}

testSignal().catch(console.error);
