export type SystemStatusValue = 'READY' | 'LOADING' | 'EMPTY' | 'DEGRADED';

export interface SystemStatusReport {
  status: SystemStatusValue;
  /** Human-readable summary */
  summary: string;
  /** Per-area status breakdown */
  areas: {
    groupManager: 'ready' | 'loading';
    keys: 'populated' | 'empty' | 'partial' | 'degraded';
    passports: 'full' | 'partial' | 'missing';
    projections: 'synced' | 'stale' | 'unavailable';
  };
  /** Active warnings (non-fatal issues, e.g. keys without passports) */
  warnings: string[];
  /** Timestamp of this report */
  timestamp: number;
}

export interface ISystemStatusService {
  /** Compute current system status from live sources */
  getStatus(): SystemStatusReport;
}
