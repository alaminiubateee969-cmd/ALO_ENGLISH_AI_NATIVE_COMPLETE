/**
 * Disabled compatibility stub for the legacy agent self-evolution module.
 *
 * No learning signal currently has the validation required to automatically
 * create specialists, tune thresholds, approve changes, or deploy new agent
 * configuration. This method is intentionally side-effect free.
 */
export type EvolutionResult = {
  agentsImproved: 0;
  newSpecialistsCreated: 0;
  evolutions: [];
};

type Insight = {
  agentId: string;
  agentType: 'EXAMINER' | 'EVALUATOR' | 'QUESTION_GENERATOR' | 'ORCHESTRATOR';
  type: 'WEAKNESS' | 'STRENGTH' | 'INFO';
  area: string;
  severity: number;
  description: string;
  insight: string;
  metricType?: string;
  metricValue?: number;
  examTypeCode?: string;
};

export class AgentSelfBuilder {
  static async evaluateAndEvolve(_insights: Insight[]): Promise<EvolutionResult> {
    return {
      agentsImproved: 0,
      newSpecialistsCreated: 0,
      evolutions: [],
    };
  }
}
