import { describe, expect, it } from 'vitest';
import { applyModeToSession } from './debate-session-bridge';

describe('applyModeToSession (SPEC_07 / P1)', () => {
    it('strict_logic применяет temperature/strategy/maxRounds и quality', () => {
        const hints = applyModeToSession('strict_logic');
        expect(hints.temperature).toBe(0.3);
        expect(hints.maxRounds).toBe(6);
        expect(hints.strategy).toBe('builtin.round_robin');
        expect(hints.forcedQuality).toEqual(
            expect.arrayContaining([
                'evidence-triangulation',
                'fact-checking',
                'rhetoric-safety',
                'consistency-check',
                'belief-mining',
            ]),
        );
    });

    it('brainstorming не форсирует constraint', () => {
        const hints = applyModeToSession('brainstorming');
        expect(hints.constraint).toBeUndefined();
        expect(hints.temperature).toBe(0.9);
        expect(hints.maxRounds).toBe(8);
    });

    it('неизвестный режим возвращает пустые подсказки', () => {
        const hints = applyModeToSession('no_such_mode');
        expect(hints.forcedQuality).toEqual([]);
        expect(hints.strategy).toBeUndefined();
    });
});
