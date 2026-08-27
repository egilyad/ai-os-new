export interface GovTestScenario {
  name: string;
  description: string;
  category: string;
  policyViolated?: string;
  slaMode?: string;
  simulatedAction: string;
}

export type GovScenarioOutcome = 'pass' | 'warn' | 'block';

export interface GovScenarioResult {
  scenario: GovTestScenario;
  result: GovScenarioOutcome;
  violatedRules: string[];
  suggestedMitigation: string;
}

export interface GovStressSummary {
  passed: number;
  warned: number;
  blocked: number;
  total: number;
}

export interface GovStressReport {
  timestamp: number;
  summary: GovStressSummary;
  results: GovScenarioResult[];
  livePolicyCount: number;
  liveViolationCount: number;
  roleCount: number;
}

export interface GovPolicyInput {
  type: string;
  value?: number;
  enabled?: boolean;
}

export interface GovViolationInput {
  type: string;
  message?: string;
}

export interface IGovStressTestService {
  getScenarios(): GovTestScenario[];
  simulateScenario(
    scenario: GovTestScenario,
    policies: GovPolicyInput[],
    violations: GovViolationInput[],
  ): GovScenarioResult;
  runAllScenarios(): GovScenarioResult[];
  buildReport(results: GovScenarioResult[]): GovStressReport;
  summarize(results: GovScenarioResult[]): GovStressSummary;
}
