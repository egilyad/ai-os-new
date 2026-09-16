import { describe, it, expect } from 'vitest';
import { LensEngineService } from './lens-engine-service';
import { LENS_LIBRARY } from './lens-library';
import type { LensContext } from '../../types/lens-types';

describe('LensEngineService', () => {
    const makeCtx = (userPrompt = 'Исходный запрос'): LensContext => ({
        roleSystemPrompt: 'Ты — эксперт.',
        userPrompt,
        conversationHistory: ['предыдущее сообщение'],
        meta: {},
    });

    describe('listLenses / getLens', () => {
        it('loads builtin lenses from the library', () => {
            const engine = new LensEngineService();
            expect(engine.listLenses().length).toBeGreaterThanOrEqual(10);
            expect(engine.listLenses('analytical').length).toBeGreaterThan(0);
        });

        it('returns undefined for unknown lens', () => {
            const engine = new LensEngineService();
            expect(engine.getLens('lens:nope')).toBeUndefined();
        });

        it('filters by category', () => {
            const engine = new LensEngineService();
            const temporal = engine.listLenses('temporal');
            expect(temporal.every((l) => l.category === 'temporal')).toBe(true);
        });
    });

    describe('validateStack', () => {
        it('accepts a valid stack', () => {
            const engine = new LensEngineService();
            const result = engine.validateStack(['lens:critical', 'lens:second-order']);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('rejects unknown lens ids', () => {
            const engine = new LensEngineService();
            const result = engine.validateStack(['lens:unknown']);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('Unknown lens'))).toBe(true);
        });

        it('rejects conflicting lenses', () => {
            const engine = new LensEngineService();
            const result = engine.validateStack(['lens:meta-consensus', 'lens:meta-dissent']);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('conflicts'))).toBe(true);
        });

        it('rejects stacks larger than max size', () => {
            const engine = new LensEngineService();
            const ids = engine
                .listLenses()
                .slice(0, 6)
                .map((l) => l.id);
            const result = engine.validateStack(ids);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('Max stack size'))).toBe(true);
        });

        it('resolves order by priority descending', () => {
            const engine = new LensEngineService();
            const critical = engine.getLens('lens:critical');
            const optimistic = engine.getLens('lens:optimistic');
            expect(critical?.priority).toBeGreaterThan(optimistic?.priority ?? 0);
            const result = engine.validateStack(['lens:optimistic', 'lens:critical']);
            expect(result.resolvedOrder[0]).toBe('lens:critical');
        });
    });

    describe('applyStack', () => {
        it('prefixes user prompt for prompt-prefix lenses', () => {
            const engine = new LensEngineService();
            const result = engine.applyStack({
                context: makeCtx(),
                lensIds: ['lens:second-order'],
            });
            expect(result.context.userPrompt).toContain('последствия 2-го и 3-го порядка');
            expect(result.context.userPrompt).toContain('Исходный запрос');
        });

        it('injects perspective questions for perspective lenses', () => {
            const engine = new LensEngineService();
            const result = engine.applyStack({
                context: makeCtx(),
                lensIds: ['lens:critical'],
            });
            expect(result.context.userPrompt).toContain('Какое неявное допущение');
            expect(result.context.userPrompt).toContain('Какой контрпример');
        });

        it('applies multiple lenses in priority order', () => {
            const engine = new LensEngineService();
            const result = engine.applyStack({
                context: makeCtx(),
                lensIds: ['lens:critical', 'lens:second-order'],
            });
            expect(result.appliedLensIds).toContain('lens:critical');
            expect(result.appliedLensIds).toContain('lens:second-order');
            expect(result.context.userPrompt).toContain('последствия 2-го и 3-го порядка');
            expect(result.context.userPrompt).toContain('Какое неявное допущение');
        });

        it('skips unknown lenses without throwing', () => {
            const engine = new LensEngineService();
            const result = engine.applyStack({
                context: makeCtx(),
                lensIds: ['lens:does-not-exist'],
            });
            expect(result.context.userPrompt).toBe('Исходный запрос');
            expect(result.appliedLensIds).toEqual([]);
        });
    });

    describe('suggestLenses', () => {
        it('suggests lenses matching role tags', () => {
            const engine = new LensEngineService();
            const suggestions = engine.suggestLenses(makeCtx(), {
                id: 'role:dev',
                name: 'Security Engineer',
                systemPrompt: 'review architecture for security vulnerabilities',
                category: 'technical',
                metadata: { tags: ['security', 'risk'] },
            });
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions.some((s) => s.lensId === 'lens:security')).toBe(true);
        });

        it('returns suggestions sorted by confidence descending', () => {
            const engine = new LensEngineService();
            const suggestions = engine.suggestLenses(makeCtx(), {
                id: 'role:analyst',
                name: 'Critical Analyst',
                systemPrompt: 'find weaknesses and assumptions',
                category: 'analytical',
                metadata: { tags: ['analysis', 'critical'] },
            });
            for (let i = 1; i < suggestions.length; i++) {
                const prev = suggestions[i - 1];
                const curr = suggestions[i];
                expect(prev!.confidence).toBeGreaterThanOrEqual(curr!.confidence);
            }
        });
    });

    describe('addLens', () => {
        it('adds a custom lens at runtime', () => {
            const engine = new LensEngineService([]);
            expect(engine.listLenses().length).toBe(0);
            const first = LENS_LIBRARY[0];
            expect(first).toBeDefined();
            engine.addLens(first!);
            expect(engine.getLens(first!.id)).toBeDefined();
        });
    });
});
