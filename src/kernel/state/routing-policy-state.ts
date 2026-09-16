import type { FallbackLink, FallbackRecord, PenaltyRecord } from '../contracts/routing-policy';

export interface RoutingPolicyStateSnapshot {
  fallbackChains: Record<string, FallbackLink[]>;
  downgradeChains: Record<string, string[]>;
  fallbackHistory: FallbackRecord[];
  penaltyHistory: PenaltyRecord[];
}
