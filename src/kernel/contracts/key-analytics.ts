import type { ApiKey } from '../types/metrics-types';

export interface IKeyAnalyticsService {
  recordUsage(key: ApiKey, latency: number, tokens?: number, model?: string, extra?: Record<string, unknown>): void;
  updateMetricsFromResponse(key: ApiKey, res: {
    keyId?: string;
    provider: string;
    status: string;
    error?: string;
    latency?: number;
    ttft?: number;
    tokens?: number | { total?: number };
    tps?: number;
  }): void;
  calculateReputation(key: ApiKey): void;
  recalculateAllReputations(keys: ApiKey[]): void;
  incrementConcurrency(key: ApiKey): void;
  decrementConcurrency(key: ApiKey): void;
  resetKeyStats(key: ApiKey): void;
}
