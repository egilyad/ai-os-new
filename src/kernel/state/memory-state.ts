export interface MemoryPlaneStats {
  readonly totalEntries: number;
  readonly totalSizeBytes: number;
  readonly maxEntries: number;
  readonly maxSizeBytes: number;
  readonly utilizationPercent: number;
  readonly oldestEntry: number;
  readonly newestEntry: number;
  readonly averageEntrySize: number;
}

export interface CachePlaneStats {
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly hitRate: number;
  readonly cachedEntries: number;
  readonly cacheSizeBytes: number;
  readonly maxCacheSize: number;
}

export interface StorePlaneStats {
  readonly pendingWrites: number;
  readonly completedWrites: number;
  readonly failedWrites: number;
  readonly avgWriteLatency: number;
  readonly kvEntries: number;
  readonly dbSizeBytes: number;
}

export interface MemoryStateSnapshot {
  readonly memory: MemoryPlaneStats;
  readonly cache: CachePlaneStats;
  readonly store: StorePlaneStats;
  readonly updatedAt: number;
  readonly isPersisting: boolean;
  readonly lastPersistAt: number;
}

export interface MemoryPressureIndicators {
  readonly nearingCapacity: boolean;
  readonly highWriteLatency: boolean;
  readonly cacheThrashing: boolean;
  readonly persistBacklog: boolean;
  readonly score: number; // 0-1 pressure score
}
