export interface CacheStateEntry {
  key: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  timestamp: number;
  ttl: number;
  hitCount: number;
  age: number;
  expired: boolean;
}

export interface CacheStateSnapshot {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryEstimateBytes: number;
  entries: CacheStateEntry[];
  oldestEntry: number;
  newestEntry: number;
}
