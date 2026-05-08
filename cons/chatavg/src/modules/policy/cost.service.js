const db = require('../../core/sqlite');
const { v4: uuidv4 } = require('uuid');

class CostService {
  /**
   * Records a cost event in the database.
   */
  static recordCost(runId, actionType, actionId, costUsd, metadata = {}) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO cost_events (id, run_id, action_type, action_id, cost_usd, metadata, created_at)
      VALUES (@id, @run_id, @action_type, @action_id, @cost_usd, @metadata, @created_at)
    `);

    stmt.run({
      id,
      run_id: runId,
      action_type: actionType,
      action_id: actionId,
      cost_usd: costUsd,
      metadata: JSON.stringify(metadata),
      created_at: now
    });

    // Update budget if applicable
    if (runId) {
      this.updateBudget('run', runId, costUsd);
    }

    return id;
  }

  /**
   * Updates or creates a budget record and adds the cost.
   */
  static updateBudget(ownerType, ownerId, costToAdd) {
    const now = Date.now();
    
    // UPSERT pattern for budget_records
    const stmt = db.prepare(`
      INSERT INTO budget_records (id, owner_type, owner_id, current_cost_usd, updated_at)
      VALUES (@id, @owner_type, @owner_id, @cost, @now)
      ON CONFLICT(id) DO UPDATE SET 
        current_cost_usd = current_cost_usd + excluded.current_cost_usd,
        updated_at = excluded.updated_at
    `);

    // Using a composite ID for budget records to simplify UPSERT if we don't have unique constraint on ownerType/Id
    // In a real app we might use owner_type + owner_id as primary key
    const budgetId = `${ownerType}:${ownerId}`;

    stmt.run({
      id: budgetId,
      owner_type: ownerType,
      owner_id: ownerId,
      cost: costToAdd,
      now
    });
  }

  /**
   * Retrieves budget for a given owner.
   */
  static getBudget(ownerType, ownerId) {
    const budgetId = `${ownerType}:${ownerId}`;
    return db.prepare('SELECT * FROM budget_records WHERE id = ?').get(budgetId);
  }

  /**
   * Checks if an action is within budget limits.
   */
  static isWithinBudget(ownerType, ownerId, estimatedCostUsd) {
    const budget = this.getBudget(ownerType, ownerId);
    if (!budget || !budget.max_cost_usd) return true; // No limit set

    return (budget.current_cost_usd + estimatedCostUsd) <= budget.max_cost_usd;
  }
}

module.exports = { CostService };
