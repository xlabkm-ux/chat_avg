export class CostService {
    static PRICING: {
        'gpt-4o': {
            prompt: number;
            completion: number;
        };
        'gpt-3.5-turbo': {
            prompt: number;
            completion: number;
        };
        default: {
            prompt: number;
            completion: number;
        };
    };
    /**
     * Calculate cost for a model call.
     */
    static calculateModelCost(model: any, promptTokens: any, completionTokens: any): number;
    /**
     * Generate an initial estimate for a run.
     */
    static estimateRun(missionMode?: string): {
        currency: string;
    };
}
