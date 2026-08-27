export type ProviderStateStatus = 'active' | 'degraded' | 'offline' | 'banned' | 'unchecked';

export interface ProviderRawMetrics {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  errors: number;
  avgLatency: number;
  avgTtft: number;
  avgTps: number;
  lastUsed: number;
  reputation: number;
  successRate: number;
}

export interface ProviderStateEntry {
  readonly id: string;
  readonly provider: string;
  readonly label: string;
  readonly model: string;
  readonly status: ProviderStateStatus;
  readonly metrics: ProviderRawMetrics;
  readonly availableModels: string[];
  readonly lastHealthCheck: number;
  readonly slaMode?: string;
  readonly stateHistory: Array<{ state: ProviderStateStatus; timestamp: number; reason: string }>; // M-38: currently unused — data is never pushed; kept for forward compat
}

export interface ProviderStateSnapshot {
  readonly providers: ProviderStateEntry[];
  readonly updatedAt: number;
  readonly totalActive: number;
  readonly totalDegraded: number;
  readonly totalOffline: number;
  readonly avgSuccessRate: number;
}

export interface LatencyDistribution {
  readonly p50: number;
  readonly p90: number;
  readonly p99: number;
  readonly samples: number;
}

export interface ProviderErrorBreakdown {
  readonly rateLimit: number;
  readonly timeout: number;
  readonly serverError: number;
  readonly authError: number;
  readonly other: number;
  readonly total: number;
}
