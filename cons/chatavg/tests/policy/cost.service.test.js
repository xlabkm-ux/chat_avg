const { describe, it } = require('node:test');
const assert = require('node:assert');
const { CostService } = require('../../src/modules/execution/cost.service');

describe('CostService', () => {
  it('should calculate cost correctly', () => {
    const cost = CostService.calculateModelCost('gpt-4o', 1000, 1000);
    assert.strictEqual(cost, 0.02); // 0.005 + 0.015
  });

  it('should generate run estimate', () => {
    const estimate = CostService.estimateRun('fast');
    assert.strictEqual(estimate.maxCostUsd, 0.05);
  });
});
