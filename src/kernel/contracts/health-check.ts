import type { ApiKey } from '../types/metrics-types';

export interface IHealthCheckService {
  handleProviderError(key: ApiKey, error: string): void;
  check429Spike(keyId: string): void;
  getBackoffMs(keyId: string): number;
  getBackoffRemaining(keyId: string): number | null;
  resetRetryCount(keyId: string): void;
  transitionState(key: ApiKey, newState: string): void;
  checkHealth(keyId: string): Promise<{ id: string; provider: string; status: string; latency: number }>;
  checkAllHealth(): Promise<{ id: string; provider: string; status: string; latency: number }[]>;
  updateKeyStatus(key: ApiKey, status: ApiKey['status'], latency?: number): void;
  updateAvailableModels(key: ApiKey, models: string[]): void;
  toggleKeyStatus(key: ApiKey): void;
  enableAllKeys(keys: ApiKey[]): void;
  disableAllKeys(keys: ApiKey[]): void;
  quarantineKey(key: ApiKey, source: string): boolean;
  compromiseKey(key: ApiKey, source: string): void;
}
