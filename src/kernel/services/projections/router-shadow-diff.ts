import type { ProjectedDecision } from './router-projection';
import type { RouterDecision } from '../provider-router';

export interface RouterDiffEntry {
  requestId: string;
  field: string;
  live: unknown;
  projected: unknown;
  severity: 'critical' | 'high' | 'medium';
}

export interface RouterDiffReport {
  totalLive: number;
  totalProjected: number;
  matched: number;
  missingInProjection: string[];
  missingInLive: string[];
  mismatches: RouterDiffEntry[];
  criticalCount: number;
  driftScore: number;
}

export function compareRouterDecisions(
  liveDecisions: RouterDecision[],
  projectedMap: Map<string, ProjectedDecision>,
): RouterDiffReport {
  const mismatches: RouterDiffEntry[] = [];
  const missingInProjection: string[] = [];
  const missingInLive: string[] = [];

  const projectedIds = new Set(projectedMap.keys());
  const liveMap = new Map(liveDecisions.map(d => [d.requestId, d]));

  for (const [liveId, live] of liveMap) {
    const projected = projectedMap.get(liveId);
    if (!projected) {
      missingInProjection.push(liveId);
      continue;
    }

    if (live.selected !== projected.selected) {
      mismatches.push({
        requestId: liveId, field: 'selected',
        live: live.selected, projected: projected.selected,
        severity: 'critical',
      });
    }
    if (live.secondBest !== projected.secondBest) {
      mismatches.push({
        requestId: liveId, field: 'secondBest',
        live: live.secondBest, projected: projected.secondBest,
        severity: 'high',
      });
    }
    if (live.scores.length !== projected.scores.length) {
      mismatches.push({
        requestId: liveId, field: 'scores.length',
        live: live.scores.length, projected: projected.scores.length,
        severity: 'high',
      });
    }
    if (live.timestamp !== projected.timestamp) {
      const diff = Math.abs(live.timestamp - projected.timestamp);
      if (diff > 100) {
        mismatches.push({
          requestId: liveId, field: 'timestamp',
          live: live.timestamp, projected: projected.timestamp,
          severity: 'medium',
        });
      }
    }
  }

  for (const projId of projectedIds) {
    if (!liveMap.has(projId)) {
      missingInLive.push(projId);
    }
  }

  const criticalCount = mismatches.filter(m => m.severity === 'critical').length;
  // B10-45: Use liveDecisions.length as base to prevent negative matched count
  const matched = Math.max(0, liveDecisions.length - missingInProjection.length);
  const total = Math.max(liveDecisions.length, projectedMap.size);
  const driftScore = total > 0
    ? Math.min(100, Math.round((criticalCount * 30 + mismatches.length * 10) / Math.max(total, 1)))
    : 0;

  return {
    totalLive: liveDecisions.length,
    totalProjected: projectedMap.size,
    matched,
    missingInProjection,
    missingInLive,
    mismatches,
    criticalCount,
    driftScore,
  };
}
