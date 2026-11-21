import { describe, it, expect } from 'vitest';
import { MissionMetricsService } from './mission-metrics-service';

const mission = (over: Partial<Parameters<MissionMetricsService['record']>[0]> = {}) => ({
    missionId: 'm1',
    goal: 'goal',
    status: 'completed' as const,
    replans: 0,
    costUsd: 0.1,
    firstArtifactMs: 500,
    durationMs: 2000,
    ...over,
});

describe('MissionMetricsService', () => {
    it('returns zeroed summary when empty', () => {
        const svc = new MissionMetricsService();
        expect(svc.summary().total).toBe(0);
        expect(svc.summary().completionRate).toBe(0);
    });

    it('aggregates mission-level metrics', () => {
        const svc = new MissionMetricsService();
        svc.record(mission());
        svc.record(
            mission({
                missionId: 'm2',
                status: 'failed',
                replans: 2,
                costUsd: 0.3,
                firstArtifactMs: 1500,
                durationMs: 5000,
            }),
        );
        const s = svc.summary();
        expect(s.total).toBe(2);
        expect(s.completed).toBe(1);
        expect(s.completionRate).toBe(0.5);
        expect(s.noReplanRate).toBe(0.5);
        expect(s.avgReplans).toBe(1);
        expect(s.avgCostUsd).toBeCloseTo(0.2);
        expect(s.avgFirstArtifactMs).toBe(1000);
        expect(s.avgDurationMs).toBe(3500);
    });

    it('computes verifier accuracy only when ground truth is supplied', () => {
        const svc = new MissionMetricsService();
        svc.record(mission({ verification: 'pass', actualSuccess: true }));
        svc.record(mission({ verification: 'reject', actualSuccess: true }));
        svc.record(mission({ verification: 'pass' }));
        const s = svc.summary();
        expect(s.verifierAccuracy).toBe(0.5);
    });

    it('keeps only the last 200 missions', () => {
        const svc = new MissionMetricsService();
        for (let i = 0; i < 250; i++) svc.record(mission({ missionId: `m${i}` }));
        expect(svc.summary().total).toBe(200);
    });

    it('supports reset', () => {
        const svc = new MissionMetricsService();
        svc.record(mission());
        svc.reset();
        expect(svc.summary().total).toBe(0);
    });
});
