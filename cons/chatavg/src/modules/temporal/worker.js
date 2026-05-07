const { Worker } = require('@temporalio/worker');
const { TEMPORAL_URL } = require('../../core/config');
const activities = require('./activities');

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'agent-runs-queue',
    connectionOptions: {
      address: TEMPORAL_URL
    }
  });

  console.log('Temporal Worker listening on queue: agent-runs-queue');
  await worker.run();
}

run().catch((err) => {
  console.error('Temporal Worker failed to start', err);
  process.exit(1);
});
