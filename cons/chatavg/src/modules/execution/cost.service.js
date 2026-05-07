class CostService {
  // Rough average cost estimation (USD) for testing purposes
  static PRICING = {
    'gpt-4o': { prompt: 0.005 / 1000, completion: 0.015 / 1000 },
    'gpt-3.5-turbo': { prompt: 0.0005 / 1000, completion: 0.0015 / 1000 },
    'default': { prompt: 0.001 / 1000, completion: 0.002 / 1000 }
  };

  /**
   * Calculate cost for a model call.
   */
  static calculateModelCost(model, promptTokens, completionTokens) {
    const rates = this.PRICING[model] || this.PRICING['default'];
    return (promptTokens * rates.prompt) + (completionTokens * rates.completion);
  }

  /**
   * Generate an initial estimate for a run.
   */
  static estimateRun(missionMode = 'fast') {
    const estimate = {
      currency: 'USD'
    };
    if (missionMode === 'fast') {
      estimate.estimatedTokens = 2000;
      estimate.maxCostUsd = 0.05;
    } else {
      estimate.estimatedTokens = 10000;
      estimate.maxCostUsd = 0.50; // default safe limit
    }
    return estimate;
  }
}

module.exports = { CostService };
