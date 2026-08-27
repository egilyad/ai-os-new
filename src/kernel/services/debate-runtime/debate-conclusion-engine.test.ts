import { describe, it, expect, vi } from 'vitest';
import { DebateConclusionEngine } from './debate-conclusion-engine';
import type { DebateSessionSnapshot, TimelineEntry } from '../../contracts/debate-runtime';

function makeSnapshot(overrides?: Partial<DebateSessionSnapshot>): DebateSessionSnapshot {
    return {
        id: 'session-1',
        topic: 'Test debate topic',
        phase: 'completed',
        version: 1,
        round: 3,
        agentStates: [
            {
                agentId: 'agent-1',
                nodeId: 'node-1',
                phase: 'completed',
                round: 3,
                tokensUsed: 100,
                latency: 50,
                lastActiveAt: Date.now(),
            },
            {
                agentId: 'agent-2',
                nodeId: 'node-2',
                phase: 'completed',
                round: 3,
                tokensUsed: 80,
                latency: 40,
                lastActiveAt: Date.now(),
            },
        ],
        totalTokens: 2000,
        totalCost: 0.05,
        startedAt: Date.now() - 60000,
        updatedAt: Date.now(),
        language: 'ru',
        topology: {
            id: 'topo-1',
            type: 'roundtable',
            nodes: [
                { id: 'agent-1', label: 'Proponent', role: 'pro' },
                { id: 'agent-2', label: 'Opponent', role: 'con' },
            ],
            edges: [],
            maxRounds: 5,
        },
        ...overrides,
    };
}

function makeTimeline(entries?: Partial<TimelineEntry>[]): TimelineEntry[] {
    const defaults: TimelineEntry[] = [
        {
            id: 't1',
            type: 'agent:responded',
            sessionId: 'session-1',
            timestamp: Date.now(),
            payload: {
                agentId: 'agent-1',
                content: 'Я поддерживаю эту идею, это преимущество для всех',
                round: 1,
            },
        },
        {
            id: 't2',
            type: 'agent:responded',
            sessionId: 'session-1',
            timestamp: Date.now(),
            payload: {
                agentId: 'agent-2',
                content: 'Я против этого, есть серьёзные риски',
                round: 1,
            },
        },
    ];
    if (!entries) return defaults;
    return defaults.map((d, i) => ({ ...d, ...entries[i] }));
}

describe('DebateConclusionEngine', () => {
    it('generates verdict with heuristic path', () => {
        const engine = new DebateConclusionEngine();
        const verdict = engine.generateVerdict(makeSnapshot(), makeTimeline());
        expect(verdict.sessionId).toBe('session-1');
        expect(verdict.topic).toBe('Test debate topic');
        expect(verdict.conclusionType).toBeDefined();
        expect(verdict.stanceResult).toBeDefined();
        expect(verdict.summary).toContain('Test debate topic');
        expect(verdict.reasoning).toBeDefined();
        expect(verdict.confidence).toBeGreaterThan(0);
    });

    it('generateVerdict returns inconclusive for low tokens', () => {
        const engine = new DebateConclusionEngine();
        const verdict = engine.generateVerdict(makeSnapshot({ totalTokens: 100 }), makeTimeline());
        expect(verdict.conclusionType).toBe('inconclusive');
    });

    it('inferStance detects pro stance', () => {
        const engine = new DebateConclusionEngine();
        const stub = engine.generateVerdict(makeSnapshot(), makeTimeline());
        const args = stub.keyArguments;
        const pro = args.find((a) => a.stance === 'pro');
        expect(pro).toBeDefined();
    });

    it('inferStance detects con stance', () => {
        const engine = new DebateConclusionEngine();
        const stub = engine.generateVerdict(makeSnapshot(), makeTimeline());
        const args = stub.keyArguments;
        const con = args.find((a) => a.stance === 'con');
        expect(con).toBeDefined();
    });

    it('determineConclusionType returns dominance when one side dominates', () => {
        const engine = new DebateConclusionEngine();
        const snapshot = makeSnapshot({ totalTokens: 5000 });
        const timeline: TimelineEntry[] = [
            {
                id: 't1',
                type: 'agent:responded',
                sessionId: 's1',
                timestamp: Date.now(),
                payload: {
                    agentId: 'pro',
                    content:
                        'I wholeheartedly support and agree with the benefits and advantages of this proposal. The advantages are clear.',
                    round: 1,
                },
            },
            {
                id: 't2',
                type: 'agent:responded',
                sessionId: 's1',
                timestamp: Date.now(),
                payload: {
                    agentId: 'pro',
                    content:
                        'The benefits support our position and I agree with the advantages mentioned',
                    round: 2,
                },
            },
            {
                id: 't3',
                type: 'agent:responded',
                sessionId: 's1',
                timestamp: Date.now(),
                payload: {
                    agentId: 'pro',
                    content:
                        'I support this approach and agree with its advantages and benefits for growth',
                    round: 3,
                },
            },
            {
                id: 't4',
                type: 'agent:responded',
                sessionId: 's1',
                timestamp: Date.now(),
                payload: {
                    agentId: 'pro',
                    content: 'Another pro argument supporting the benefits and advantages',
                    round: 4,
                },
            },
        ];
        const verdict = engine.generateVerdict(snapshot, timeline);
        expect(verdict.conclusionType).toBe('dominance');
    });

    it('recordFeedback and getFeedback round-trip', () => {
        const engine = new DebateConclusionEngine();
        engine.recordFeedback('session-1', 'agree', 'Good verdict');
        engine.recordFeedback('session-1', 'disagree');
        const all = engine.getFeedback();
        expect(all).toHaveLength(2);
        const filtered = engine.getFeedback('session-1');
        expect(filtered).toHaveLength(2);
    });

    it('getFeedbackStats computes ratio', () => {
        const engine = new DebateConclusionEngine();
        engine.recordFeedback('session-1', 'agree');
        engine.recordFeedback('session-1', 'agree');
        engine.recordFeedback('session-1', 'disagree');
        const stats = engine.getFeedbackStats('session-1');
        expect(stats.agrees).toBe(2);
        expect(stats.disagrees).toBe(1);
        expect(stats.ratio).toBeCloseTo(2 / 3);
    });

    it('getFeedbackStats returns neutral when no feedback', () => {
        const engine = new DebateConclusionEngine();
        const stats = engine.getFeedbackStats('no-session');
        expect(stats.agrees).toBe(0);
        expect(stats.disagrees).toBe(0);
        expect(stats.ratio).toBe(0.5);
    });

    it('generateVerdictWithLLM returns base when no llmCall provided', async () => {
        const engine = new DebateConclusionEngine();
        const verdict = await engine.generateVerdictWithLLM(makeSnapshot(), makeTimeline());
        expect(verdict.confidence).toBeGreaterThan(0);
    });

    it('generateVerdictWithLLM uses llmCall when provided', async () => {
        const mockLlm = vi
            .fn()
            .mockResolvedValue(
                JSON.stringify({ summary: 'LLM summary', reasoning: 'LLM reasoning' }),
            );
        const engine = new DebateConclusionEngine(mockLlm);
        const verdict = await engine.generateVerdictWithLLM(makeSnapshot(), makeTimeline());
        expect(mockLlm).toHaveBeenCalled();
        expect(verdict.sessionId).toBe('session-1');
    });

    it('generateVerdictWithLLM falls back to base when LLM fails', async () => {
        const mockLlm = vi.fn().mockRejectedValue(new Error('LLM call failed'));
        const engine = new DebateConclusionEngine(mockLlm);
        const verdict = await engine.generateVerdictWithLLM(makeSnapshot(), makeTimeline());
        expect(verdict.confidence).toBeGreaterThan(0);
    });

    it('generateVerdictWithLLM respects retry-after cooldown', async () => {
        const mockLlm = vi.fn().mockRejectedValue(new Error('fail'));
        const engine = new DebateConclusionEngine(mockLlm);
        await engine.generateVerdictWithLLM(makeSnapshot(), makeTimeline());
        const second = await engine.generateVerdictWithLLM(
            makeSnapshot({ id: 'session-2' }),
            makeTimeline(),
        );
        expect(second.confidence).toBeGreaterThan(0);
    });

    it('destroy clears all state', () => {
        const engine = new DebateConclusionEngine();
        engine.recordFeedback('s1', 'agree');
        engine.destroy();
        expect(engine.getFeedback()).toHaveLength(0);
    });
});
