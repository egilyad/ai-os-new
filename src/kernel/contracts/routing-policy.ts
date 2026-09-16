export interface FallbackLink {
  provider: string;
  model?: string;
}

export interface FallbackRecord {
  provider: string;
  strategy: string;
  timestamp: number;
  resolved: boolean;
}

export interface PenaltyRecord {
  provider: string;
  type: 'latency' | 'cost' | 'budget' | 'error_rate' | 'success_rate' | 'alert';
  amount: number;
  timestamp: number;
}

export interface HealthPenaltyInput {
  avgLatency: number;
  errorRate: number;
  successRate: number;
  criticalAlerts: number;
}

export interface HealthPenaltyResult {
  score: number;
  issues: string[];
}

export interface RoutingPolicySnapshot {
  fallbackChains: Record<string, FallbackLink[]>;
  modelDowngradeChains: Record<string, string[]>;
  slaMode: string;
  fallbackHistory: FallbackRecord[];
  penaltyHistory: PenaltyRecord[];
  penaltySettings: {
    latency: { thresholdRatio: number; max: number; slope: number };
    cost: { scalar: number };
    budget: { thresholds: { pct: number; penalty: number }[] };
    health: {
      latencyThresholdMs: number;
      errorRateThreshold: number;
      successRateFloor: number;
      alertPenaltyPerAlert: number;
    };
  };
}

export interface RoutingPolicyPreviewInput {
  strategy: string;
  failedProvider?: string;
  model?: string;
  downgradeSteps?: number;
  promptLength?: number;
  provider?: string;
  avgLatency?: number;
  medianLatency?: number;
  spentThisMonth?: number;
  monthlyBudget?: number;
  health?: HealthPenaltyInput;
}

export interface RoutingPolicyPreview {
  fallback: FallbackLink | null;
  downgradedModel: string | null;
  penalties: Partial<Record<PenaltyRecord['type'], number>>;
  health: HealthPenaltyResult | null;
  issues: string[];
}

export interface IRoutingPolicy {
  getSnapshot(): RoutingPolicySnapshot;
  preview(input: RoutingPolicyPreviewInput): RoutingPolicyPreview;

  getFallbackChain(strategy: string): FallbackLink[];
  setFallbackChain(strategy: string, chain: FallbackLink[]): void;
  resolveFallback(strategy: string, failedProvider: string, agentId?: string): FallbackLink | null;
  recordFallbackFailure(provider: string, strategy: string): void;
  getFallbackHistory(): FallbackRecord[];

  getDowngradeChain(model: string): string[];
  setDowngradeChain(model: string, chain: string[]): void;
  getDowngradedModel(model: string): string | null;
  getDeepDowngradedModel(model: string, steps: number): string | null;

  calculateLatencyPenalty(providerId: string, avgLatency: number, medianLatency: number): number;
  calculateCostPenalty(model: string, promptLength: number): number;
  calculateBudgetPenalty(provider: string, spentThisMonth: number, monthlyBudget: number): number;
  calculateHealthPenalties(input: HealthPenaltyInput): HealthPenaltyResult;
  recordPenalty(provider: string, type: PenaltyRecord['type'], amount: number): void;
  getPenaltyHistory(): PenaltyRecord[];

  getSLAWeights(slaMode: string): { ttft: number; tps: number; reliability: number };

  smartDowngrade?(model: string, metrics: {
    avgLatency: number; p95Latency: number; costPerRequest: number; quotaUsed: number; quotaLimit: number;
  }): { currentModel: string; targetModel: string; reason: string; trigger: string; severity: string } | null;

  smartDowngradeDeep?(model: string, metrics: {
    avgLatency: number; p95Latency: number; costPerRequest: number; quotaUsed: number; quotaLimit: number;
  }, maxSteps?: number): { currentModel: string; targetModel: string; reason: string; trigger: string; severity: string } | null;
}
