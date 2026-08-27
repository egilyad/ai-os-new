import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FactCheckService } from './fact-check-service';
import type { DebateArgument } from '../contracts/debate-types';

vi.mock('../events/event-names', () => ({
    EVENTS: { DEBATE_FACT_CHECKED: 'debate:fact:checked' },
}));

import { EVENTS } from '../events/event-names';

function createDeps(
    overrides?: Partial<{
        eventBus: { emit: ReturnType<typeof vi.fn> };
        getApiKey: ReturnType<typeof vi.fn>;
        sendMessage: ReturnType<typeof vi.fn>;
    }>,
) {
    return {
        eventBus: { emit: vi.fn() },
        getApiKey: vi.fn(() => 'mock-api-key'),
        sendMessage: vi.fn(async () => ({ content: '' })),
        ...overrides,
    };
}

describe('FactCheckService', () => {
    let deps: ReturnType<typeof createDeps>;
    let service: FactCheckService;

    beforeEach(() => {
        deps = createDeps();
        service = new FactCheckService(deps as never);
    });

    afterEach(() => {
        service.destroy();
    });

    describe('shouldCheck', () => {
        it('returns false when level is off', () => {
            service.setLevel('off');
            expect(service.shouldCheck()).toBe(false);
        });

        it('returns true when level is all', () => {
            service.setLevel('all');
            expect(service.shouldCheck()).toBe(true);
        });

        it('returns true/false based on sample rate', () => {
            service.setLevel('sampled');
            service.setSampleRate(1);
            expect(service.shouldCheck()).toBe(true);
            service.setSampleRate(0);
            expect(service.shouldCheck()).toBe(false);
        });
    });

    describe('extractClaims', () => {
        it('returns empty for text with no claims', () => {
            expect(service.extractClaims('Hello, how are you?')).toEqual([]);
        });

        it('extracts claims with numbers and percentages', () => {
            const claims = service.extractClaims(
                'The study shows that 85% of users prefer option A. This was proven in 2023.',
            );
            expect(claims.length).toBeGreaterThanOrEqual(1);
            expect(claims.some((c) => c.includes('85%'))).toBe(true);
        });

        it('extracts claims referencing research', () => {
            const claims = service.extractClaims(
                'According to a recent study, coffee improves focus.',
            );
            expect(claims.length).toBeGreaterThanOrEqual(1);
            expect(claims.some((c) => c.includes('coffee'))).toBe(true);
        });

        it('extracts date-based claims', () => {
            const claims = service.extractClaims(
                'On 15 January 2024, the company announced profits.',
            );
            expect(claims.length).toBeGreaterThanOrEqual(1);
        });

        it('filters sentences shorter than 15 chars', () => {
            expect(service.extractClaims('Short.')).toEqual([]);
        });
    });

    describe('checkArgument — no API key', () => {
        beforeEach(() => {
            deps = createDeps({ getApiKey: vi.fn(() => undefined) });
            service = new FactCheckService(deps as never);
        });

        it('returns null when shouldCheck is false', async () => {
            service.setLevel('off');
            const arg: DebateArgument = {
                id: 'a1',
                agentId: 'ag1',
                agentName: 'Agent 1',
                content: 'The study found 80% improvement.',
                position: 'pro',
                round: 1,
                confidence: 0.8,
                timestamp: 1000,
                source: 'llm',
            };
            expect(await service.checkArgument(arg)).toBeNull();
        });

        it('returns null for text with no claims', async () => {
            service.setLevel('all');
            const arg: DebateArgument = {
                id: 'a2',
                agentId: 'ag1',
                agentName: 'Agent 1',
                content: 'Hello world.',
                position: 'pro',
                round: 1,
                confidence: 0.8,
                timestamp: 1000,
                source: 'llm',
            };
            expect(await service.checkArgument(arg)).toBeNull();
        });
    });

    describe('checkArgument — with claims', () => {
        const arg: DebateArgument = {
            id: 'a1',
            agentId: 'ag1',
            agentName: 'Agent 1',
            content:
                'The study shows 85% of users prefer option A, according to research published in 2024.',
            position: 'pro',
            round: 1,
            confidence: 0.8,
            timestamp: 1000,
            source: 'llm',
        };

        it('returns fact check result with parsed verdict', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content:
                        'CLAIM: test | VERDICT: verified | CONFIDENCE: 0.9 | REASON: well known fact',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result).not.toBeNull();
            expect(result!.argumentId).toBe('a1');
            expect(result!.results.length).toBeGreaterThanOrEqual(1);
            expect(result!.results[0].verdict).toBe('verified');
            expect(result!.results[0].confidence).toBeCloseTo(0.9);
        });

        it('handles disputed verdict', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content:
                        'CLAIM: test | VERDICT: disputed | CONFIDENCE: 0.4 | REASON: some evidence',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result!.results[0].verdict).toBe('disputed');
        });

        it('handles false verdict', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content:
                        'CLAIM: test | VERDICT: false | CONFIDENCE: 0.8 | REASON: contradicted by sources',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result!.results[0].verdict).toBe('false');
        });

        it('handles no_evidence verdict', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content:
                        'CLAIM: test | VERDICT: no_evidence | CONFIDENCE: 0.0 | REASON: cannot verify',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result!.results[0].verdict).toBe('no_evidence');
        });

        it('handles unparseable response', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content: 'I cannot answer that question.',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result!.results[0].verdict).toBe('no_evidence');
        });

        it('handles sendMessage error gracefully', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => {
                    throw new Error('API error');
                }),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');

            const result = await service.checkArgument(arg);
            expect(result!.results[0].verdict).toBe('error');
        });

        it('caches results for duplicate claims', async () => {
            const mockSend = vi.fn(async () => ({
                content: 'CLAIM: test | VERDICT: verified | CONFIDENCE: 0.9 | REASON: known',
            }));
            deps = createDeps({ sendMessage: mockSend });
            service = new FactCheckService(deps as never);
            service.setLevel('all');
            const sameArg: DebateArgument = {
                id: 'a2',
                agentId: 'ag1',
                agentName: 'Agent 1',
                content:
                    'The study shows 85% of users prefer option A, according to research published in 2024.',
                position: 'pro',
                round: 1,
                confidence: 0.8,
                timestamp: 1000,
                source: 'llm',
            };
            await service.checkArgument(arg);
            const callCount = mockSend.mock.calls.length;
            await service.checkArgument(sameArg);
            expect(mockSend.mock.calls.length).toBe(callCount);
        });

        it('returns cached result for same argument id', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content: 'CLAIM: test | VERDICT: verified | CONFIDENCE: 0.9 | REASON: known',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');
            const r1 = await service.checkArgument(arg);
            const r2 = await service.checkArgument(arg);
            expect(r1).toBe(r2);
        });

        it('emits DEBATE_FACT_CHECKED event', async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content: 'CLAIM: test | VERDICT: verified | CONFIDENCE: 0.9 | REASON: known',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');
            await service.checkArgument(arg);
            expect(deps.eventBus.emit).toHaveBeenCalledWith(
                EVENTS.DEBATE_FACT_CHECKED,
                expect.objectContaining({ argumentId: 'a1' }),
            );
        });
    });

    describe('query methods', () => {
        const arg: DebateArgument = {
            id: 'a1',
            agentId: 'ag1',
            agentName: 'Agent 1',
            content: 'According to research, 95% of tests pass.',
            position: 'pro',
            round: 1,
            confidence: 0.8,
            timestamp: 1000,
            source: 'llm',
        };

        beforeEach(async () => {
            deps = createDeps({
                sendMessage: vi.fn(async () => ({
                    content: 'CLAIM: test | VERDICT: verified | CONFIDENCE: 0.9 | REASON: known',
                })),
            });
            service = new FactCheckService(deps as never);
            service.setLevel('all');
            await service.checkArgument(arg);
        });

        it('getForArgument returns result for known id', () => {
            const r = service.getForArgument('a1');
            expect(r).toBeDefined();
            expect(r!.argumentId).toBe('a1');
        });

        it('getForArgument returns undefined for unknown id', () => {
            expect(service.getForArgument('nope')).toBeUndefined();
        });

        it('getAll returns all results', () => {
            expect(service.getAll()).toHaveLength(1);
        });

        it('getScore returns average of all scores', () => {
            const score = service.getScore();
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
        });

        it('getScore returns 1 when no results', () => {
            service.destroy();
            service = new FactCheckService(deps as never);
            expect(service.getScore()).toBe(1);
        });
    });

    describe('destroy', () => {
        it('clears caches and aborts pending requests', () => {
            service.setLevel('all');
            service.destroy();
            expect(service.getForArgument('any')).toBeUndefined();
            expect(service.getAll()).toEqual([]);
        });
    });
});
