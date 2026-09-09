import type { CanonicalHealthStatus } from '../contracts/health';

export interface DiagnosticStateSnapshot {
  readonly systemHealth: CanonicalHealthStatus;
  readonly systemScore: number;
  readonly activeIssueCount: number;
  readonly lastRun: number | null;
  readonly totalRuns: number;
}
