/**
 * Tests for Debate Enhancement services:
 * - CrossDebateMemoryService (#2)
 * - DebateBreakpointService (#3)
 * - DebateQualityBenchmarkService (#4)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrossDebateMemoryService } from './kernel/services/debate-runtime/cross-debate-memory';
import { DebateBreakpointService } from './kernel/services/debate-runtime/debate-breakpoint-service';
import { DebateQualityBenchmarkService } from './kernel/services/debate-runtime/debate-quality-benchmark';

function createStubEventBus() {
    const listeners: Array<{ event: string; fn: (data: unknown) => void }> = [];
    return {
        on: vi.fn((event: string, fn: (data: unknown) => void) => { listeners.push({ event, fn }); return () => {}; }),
        onSafe: vi.fn((event: string, fn: (data: unknown) => void) => { listeners.push({ event, fn }); return () => {}; }),
        emit: vi.fn(),
        emitOnce: vi.fn(),
        getSubscriptionStats: vi.fn(() => ({ total: 0, active: 0 })),
        _listeners: listeners,
    };
}

function makeVerdict(overrides: Record<string, unknown> = {}) {
    return {
        sessionId: 's1',
        topic: 'AI safety alignment',
        summary: 'We concluded that RLHF is a promising but incomplete approach.',
        conclusionType: 'consensus',
        stanceResult: 'partial_agreement',
        confidence: 0.75,
        keyArguments: [
            { agentId: 'a1', content: 'RLHF needs constitutional AI constraints', position: 'pro', confidence: 0.8 },
            { agentId: 'a2', content: 'Self-supervised pretraining reduces alignment tax', position: 'nuanced', confidence: 0.7 },
        ],
        reasoning: 'Multi-round convergence',
        roundsTotal: 4,
        totalTokens: 12000,
        generatedAt: Date.now(),
        ...overrides,
    };
}

function makeSession(overrides: Record<string, unknown> = {}) {
    return {
        id: 's1',
        topic: 'AI safety alignment',
        status: 'completed',
        participants: [{ id: 'a1', name: 'Agent 1' }, { id: 'a2', name: 'Agent 2' }],
        arguments: [
            { agentId: 'a1', content: 'RLHF needs constraints', position: 'pro', confidence: 0.8, round: 1 },
            { agentId: 'a2', content: 'Pretraining reduces tax', position: 'nuanced', confidence: 0.7, round: 1 },
            { agentId: 'a1', content: 'Constitutional AI is key', position: 'pro', confidence: 0.85, round: 2 },
            { agentId: 'a2', content: 'Agree on constraints', position: 'pro', confidence: 0.75, round: 2 },
        ],
        currentRound: 3,
        convergenceScore: 0.6,
        totalTokens: 8000,
        ...overrides,
    };
}

function makeStore() {
    const data = new Map<string, unknown>();
    return {
        config: {
            async get(key: string) { return data.get(key); },
            async set(key: string, value: unknown) { data.set(key, value); },
        },
    };
}

describe('CrossDebateMemoryService', () => {
    let service: CrossDebateMemoryService;
    let store: ReturnType<typeof makeStore>;
    let bus: ReturnType<typeof createStubEventBus>;

    beforeEach(() => {
        store = makeStore();
        bus = createStubEventBus();
        service = new CrossDebateMemoryService({ eventBus: bus, store });
    });

    it('indexes a verdict', async () => {
        const v = makeVerdict() as any;
        await service.indexVerdict('s1', v);
        expect(service.getEntryCount()).toBe(1);
    });

    it('does not duplicate index entries', async () => {
        const v = makeVerdict() as any;
        await service.indexVerdict('s1', v);
        await service.indexVerdict('s1', v);
        expect(service.getEntryCount()).toBe(1);
    });

    it('getContext returns related debates by keyword overlap', async () => {
        await service.indexVerdict('s1', makeVerdict() as any);
        await service.indexVerdict('s2', makeVerdict({
            sessionId: 's2',
            topic: 'Machine learning safety',
            summary: 'Different topic but related.',
        }) as any);

        const ctx = await service.getContext('AI safety and alignment');
        expect(ctx.relatedDebates.length).toBeGreaterThanOrEqual(1);
        expect(ctx.relatedDebates[0].topic).toContain('AI safety');
        expect(ctx.totalIndexed).toBe(2);
    });

    it('getContext returns empty for unrelated topic', async () => {
        await service.indexVerdict('s1', makeVerdict() as any);
        const ctx = await service.getContext('quantum computing algorithms');
        expect(ctx.relatedDebates.length).toBe(0);
    });

    it('formatContextForPrompt returns empty string when no related', async () => {
        const ctx = await service.getContext('xyz');
        expect(service.formatContextForPrompt(ctx)).toBe('');
    });

    it('formatContextForPrompt returns formatted string', async () => {
        await service.indexVerdict('s1', makeVerdict() as any);
        const ctx = await service.getContext('AI safety');
        const text = service.formatContextForPrompt(ctx);
        expect(text).toContain('Related Past Debates');
        expect(text).toContain('AI safety alignment');
    });

    it('clears the index', async () => {
        await service.indexVerdict('s1', makeVerdict() as any);
        await service.clear();
        expect(service.getEntryCount()).toBe(0);
    });

    it('persists across instances', async () => {
        await service.indexVerdict('s1', makeVerdict() as any);
        const service2 = new CrossDebateMemoryService({ eventBus: bus, store });
        await service2.loadIndex();
        expect(service2.getEntryCount()).toBe(1);
    });
});

describe('DebateBreakpointService', () => {
    let service: DebateBreakpointService;
    let bus: ReturnType<typeof createStubEventBus>;

    beforeEach(() => {
        bus = createStubEventBus();
        service = new DebateBreakpointService({ eventBus: bus });
    });

    it('sets and retrieves breakpoints', () => {
        service.setBreakpoint('s1', 'round_end', { round: 3 });
        const bps = service.getSessionBreakpoints('s1');
        expect(bps.length).toBe(1);
        expect(bps[0].trigger).toBe('round_end');
    });

    it('removes breakpoints', () => {
        const bp = service.setBreakpoint('s1', 'round_end', { round: 3 });
        expect(service.removeBreakpoint(bp.id)).toBe(true);
        expect(service.getSessionBreakpoints('s1').length).toBe(0);
    });

    it('checkBreakpoints matches round_end trigger', () => {
        service.setBreakpoint('s1', 'round_end', { round: 2 });
        const hit = service.checkBreakpoints('s1', 'round_end', 2, 5);
        expect(hit).not.toBeNull();
        expect(hit!.id).toContain('s1');
    });

    it('checkBreakpoints returns null when condition not met', () => {
        service.setBreakpoint('s1', 'round_end', { round: 5 });
        const hit = service.checkBreakpoints('s1', 'round_end', 3, 10);
        expect(hit).toBeNull();
    });

    it('checkBreakpoints matches argument_count trigger', () => {
        service.setBreakpoint('s1', 'argument_count', { argumentCount: 20 });
        const hit = service.checkBreakpoints('s1', 'argument_count', 1, 25);
        expect(hit).not.toBeNull();
    });

    it('applies and retrieves human feedback', () => {
        const bp = service.setBreakpoint('s1', 'round_end', { round: 2 });
        service.applyFeedback({
            breakpointId: bp.id,
            sessionId: 's1',
            instruction: 'Focus on safety concerns',
            steerTo: 'alignment tax',
        });
        const fb = service.getLatestFeedback('s1');
        expect(fb).toBeDefined();
        expect(fb!.instruction).toBe('Focus on safety concerns');
        expect(fb!.steerTo).toBe('alignment tax');
    });

    it('formatBreakpointContext returns instruction text', () => {
        const bp = service.setBreakpoint('s1', 'round_end', { round: 2 });
        service.applyFeedback({
            breakpointId: bp.id,
            sessionId: 's1',
            instruction: 'Emphasize evidence',
            suppressAgents: ['a1'],
        });
        const text = service.formatBreakpointContext('s1');
        expect(text).toContain('Human Instruction');
        expect(text).toContain('Emphasize evidence');
        expect(text).toContain('a1');
    });

    it('cleanup removes session data', () => {
        service.setBreakpoint('s1', 'round_end', { round: 2 });
        service.setBreakpoint('s2', 'round_end', { round: 3 });
        service.cleanup('s1');
        expect(service.getSessionBreakpoints('s1').length).toBe(0);
        expect(service.getSessionBreakpoints('s2').length).toBe(1);
    });
});

describe('DebateQualityBenchmarkService', () => {
    let service: DebateQualityBenchmarkService;
    let store: ReturnType<typeof makeStore>;
    let bus: ReturnType<typeof createStubEventBus>;

    beforeEach(() => {
        store = makeStore();
        bus = createStubEventBus();
        service = new DebateQualityBenchmarkService({ eventBus: bus, store });
    });

    it('scores a debate session', async () => {
        const session = makeSession() as any;
        const verdict = makeVerdict() as any;
        const score = await service.score(session, verdict);
        expect(score.compositeScore).toBeGreaterThan(0);
        expect(score.compositeScore).toBeLessThanOrEqual(1);
        expect(score.dimensions.length).toBe(5);
        expect(score.benchmarks.percentile).toBeGreaterThanOrEqual(0);
    });

    it('tracks agent profiles across debates', async () => {
        await service.score(makeSession({ id: 's1' }) as any);
        await service.score(makeSession({ id: 's2' }) as any);
        const profiles = service.getAllAgentProfiles();
        expect(profiles.length).toBeGreaterThanOrEqual(1);
        for (const p of profiles) {
            expect(p.totalDebates).toBeGreaterThanOrEqual(1);
        }
    });

    it('computes trend', async () => {
        await service.score(makeSession({ id: 's1' }) as any);
        const trend = service.getTrend('week');
        expect(trend.debateCount).toBe(1);
        expect(trend.avgComposite).toBeGreaterThan(0);
    });

    it('getLeaderboard returns agents sorted by confidence', async () => {
        await service.score(makeSession({ id: 's1' }) as any);
        const lb = service.getLeaderboard();
        for (let i = 1; i < lb.length; i++) {
            expect(lb[i - 1].avgConfidence).toBeGreaterThanOrEqual(lb[i].avgConfidence);
        }
    });

    it('formatBenchmarkReport returns readable text', async () => {
        await service.score(makeSession({ id: 's1' }) as any);
        const report = service.formatBenchmarkReport();
        expect(report).toContain('Debate Quality Benchmarks');
        expect(report).toContain('Top Agents');
    });

    it('persists scores across instances', async () => {
        await service.score(makeSession({ id: 's1' }) as any);
        const service2 = new DebateQualityBenchmarkService({ eventBus: bus, store });
        await service2.load();
        expect(service2.getScores().length).toBe(1);
    });

    it('empty state handles gracefully', async () => {
        const trend = service.getTrend();
        expect(trend.debateCount).toBe(0);
        const report = service.formatBenchmarkReport();
        expect(report).toContain('Debate Quality Benchmarks');
    });
});
