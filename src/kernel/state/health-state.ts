import type { CanonicalHealthStatus } from '../contracts/health';

/**
 * Extended health status for provider-level tracking.
 * Adds offline/unknown beyond the canonical model.
 */
export type HealthStatus = CanonicalHealthStatus | 'offline' | 'unknown';

export interface ProviderHealth {
  readonly id: string;
  readonly status: HealthStatus;
  readonly avgLatency: number;
  readonly errorRate: number;
  readonly lastChecked: number;
  readonly lastError?: string;
}

export interface ProviderHealthSummary {
  readonly total: number;
  readonly healthy: number;
  readonly degraded: number;
  readonly offline: number;
  readonly unknown: number;
  readonly providers: ProviderHealth[];
  readonly updatedAt: number;
  readonly overallStatus: HealthStatus;
}

export type HealthChangeEvent = {
  providerId: string;
  previous: HealthStatus;
  current: HealthStatus;
  timestamp: number;
};

export type HealthChangeListener = (event: HealthChangeEvent) => void;

export interface HealthCheckSchedule {
  readonly intervalMs: number;
  readonly lastRun: number;
  readonly nextRun: number;
  readonly isRunning: boolean;
  readonly consecutiveFailures: number;
}

export interface ProviderHealthTrend {
  providerId: string;
  statusHistory: Array<{ status: HealthStatus; timestamp: number }>;
  latencyTrend: number[];  // last N latency samples
  errorTrend: number[];    // last N error rate samples
  trendDirection: 'improving' | 'stable' | 'degrading';
  healthScore: number;     // 0-1 composite score
}
