const runRepository = require('../execution/run.repository');

async function updateRunState(runId, state, metadata = {}) {
  runRepository.updateState(runId, state, metadata);
  return true;
}

async function executeModelStep(missionId) {
  // In a real implementation, this would call LiteLLM or an LLM Provider
  // Here we just return a reference ID to demonstrate payload offloading.
  return `model_output_ref_${Date.now()}`;
}

async function processSemanticStep(modelResultId) {
  // In a real implementation, this calls SemanticProtocol
  return `semantic_ledger_ref_${Date.now()}`;
}

module.exports = {
  updateRunState,
  executeModelStep,
  processSemanticStep
};
