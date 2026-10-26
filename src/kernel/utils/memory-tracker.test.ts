import { describe, expect, it } from 'vitest';
import { estimateSessionBytes, logMemoryStats } from './memory-tracker';

describe('memory-tracker', () => {
    it('estimateSessionBytes returns 0 for null', () => {
        expect(estimateSessionBytes(null)).toBe(0);
    });

    it('estimateSessionBytes returns >0 for a serializable session', () => {
        const bytes = estimateSessionBytes({ id: 's1', topic: 'hi', arguments: [] });
        expect(bytes).toBeGreaterThan(0);
    });

    it('estimateSessionBytes returns -1 for circular structure', () => {
        const a: Record<string, unknown> = {};
        a.self = a;
        expect(estimateSessionBytes(a)).toBe(-1);
    });

    it('logMemoryStats runs without throwing for all-null args', () => {
        expect(() => logMemoryStats('test')).not.toThrow();
    });

    it('logMemoryStats runs with partial aggregates', () => {
        expect(() =>
            logMemoryStats(
                'test',
                {
                    sessionContexts: 1,
                    sessions: 1,
                    budgets: 1,
                    memories: 1,
                    sessionStartTimes: 1,
                    sessionTimeoutTimers: 1,
                    sessionAbortControllers: 1,
                    sessionAbortControllersAgents: 1,
                    sessionPhaseControllers: 1,
                    runningSessions: 1,
                    preflightDone: 1,
                    warmCache: 1,
                },
                { unsubs: 0, initUnsubs: 0, verdictCache: 0, runtimeSessionId: null, activeSessionSize: 0 },
                {
                    embeddingChunks: 0,
                    policyRules: 0,
                    policyFirings: 0,
                    modeVersions: 0,
                    strategyVersions: 0,
                    eventBusListeners: 0,
                    completedSessions: 0,
                    liveStoreAgentEvents: 0,
                    liveStoreRoundEvents: 0,
                    liveStoreStreamingMaps: 0,
                    activeDebateSession: 0,
                },
            ),
        ).not.toThrow();
    });
});
