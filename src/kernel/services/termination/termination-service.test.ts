import { describe, it, expect } from 'vitest';
import {
    TerminationService,
    maxMessages,
    maxTokens,
    timeoutMs,
    textMention,
    sourceMatch,
    handoffDetected,
    functionalCondition,
} from './termination-service';

const ctx = (over: Partial<Parameters<TerminationService['evaluate']>[0]> = {}) => ({
    messageCount: 1,
    tokenCount: 10,
    elapsedMs: 100,
    ...over,
});

describe('TerminationService predicates', () => {
    it('built-in predicates fire on their thresholds', () => {
        expect(maxMessages(3).shouldTerminate(ctx({ messageCount: 3 }))).toBe(true);
        expect(maxMessages(3).shouldTerminate(ctx({ messageCount: 2 }))).toBe(false);
        expect(maxTokens(100).shouldTerminate(ctx({ tokenCount: 100 }))).toBe(true);
        expect(timeoutMs(1000).shouldTerminate(ctx({ elapsedMs: 1000 }))).toBe(true);
        expect(textMention('DONE').shouldTerminate(ctx({ lastMessage: 'task DONE' }))).toBe(true);
        expect(sourceMatch('user').shouldTerminate(ctx({ lastSource: 'user' }))).toBe(true);
        expect(handoffDetected().shouldTerminate(ctx({ handoffDetected: true }))).toBe(true);
    });

    it('functional condition never throws outward', () => {
        const c = functionalCondition('explode', 'throws', () => {
            throw new Error('boom');
        });
        expect(c.shouldTerminate(ctx())).toBe(false);
    });
});

describe('TerminationService algebra', () => {
    it('OR (default): stop when any predicate matches', () => {
        const svc = new TerminationService();
        svc.register(maxMessages(5));
        svc.register(textMention('STOP'));
        const r = svc.evaluate(ctx({ messageCount: 1, lastMessage: 'STOP' }));
        expect(r.stop).toBe(true);
        expect(r.matched).toEqual(['textMention(STOP)']);
    });

    it('AND: stop only when all predicates match', () => {
        const svc = new TerminationService();
        svc.setOperator('all');
        svc.register(maxMessages(2));
        svc.register(maxTokens(50));
        expect(svc.evaluate(ctx({ messageCount: 2, tokenCount: 10 })).stop).toBe(false);
        expect(svc.evaluate(ctx({ messageCount: 2, tokenCount: 60 })).stop).toBe(true);
    });

    it('empty condition set never stops', () => {
        const svc = new TerminationService();
        expect(svc.evaluate(ctx()).stop).toBe(false);
        svc.setOperator('all');
        expect(svc.evaluate(ctx()).stop).toBe(false);
    });

    it('combine() produces a composable predicate usable as a child', () => {
        const svc = new TerminationService();
        const combo = svc.combine('any', [maxMessages(2), textMention('END')]);
        const outer = svc.combine('all', [combo, maxTokens(5)]);
        expect(outer.shouldTerminate(ctx({ messageCount: 2, tokenCount: 10 }))).toBe(true);
        expect(outer.shouldTerminate(ctx({ messageCount: 1, tokenCount: 10 }))).toBe(false);
        expect(outer.describe()).toContain('AND');
    });

    it('clear resets conditions and operator', () => {
        const svc = new TerminationService();
        svc.register(maxMessages(1));
        svc.clear();
        expect(svc.list()).toEqual([]);
        expect(svc.evaluate(ctx({ messageCount: 5 })).stop).toBe(false);
    });
});
