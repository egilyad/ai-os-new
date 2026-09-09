import type { ApiKey } from '../types/metrics-types';

export type PoolStrategy = 'round-robin' | 'least-usage' | 'random';

export interface IPoolSelectorService {
  getPoolStrategy(provider: string): PoolStrategy;
  setPoolStrategy(provider: string, strategy: PoolStrategy): void;
  selectFromPool(provider: string, strategy?: PoolStrategy): ApiKey | null;
  getPoolStatus(provider: string): { total: number; active: number; used: number; limit: number };
  getPoolKeyDistribution(provider: string): Array<{ id: string; label: string; used: number; limit: number; pct: number; status: string }>;
}
