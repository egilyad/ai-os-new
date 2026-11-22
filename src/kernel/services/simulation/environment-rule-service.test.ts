import { describe, it, expect } from 'vitest';
import { EnvironmentRuleService } from './environment-rule-service';

describe('EnvironmentRuleService', () => {
    it('applies rules in order and records them', async () => {
        const svc = new EnvironmentRuleService();
        const order: string[] = [];
        svc.addRule({
            id: 'a',
            describe: () => 'first',
            apply: (_obs, views) => {
                order.push('a');
                views.get('actor')!.visibleFacts['a'] = true;
            },
        });
        svc.addRule({
            id: 'b',
            describe: () => 'second',
            apply: () => {
                order.push('b');
            },
        });
        const views = await svc.observe({ actorId: 'actor', step: 1, facts: { base: 1 } });
        expect(order).toEqual(['a', 'b']);
        expect(views.get('actor')?.visibleFacts).toEqual({ base: 1, a: true });
        expect(views.get('actor')?.appliedRules).toEqual(['a', 'b']);
    });

    it('isolates a failing rule', async () => {
        const svc = new EnvironmentRuleService();
        svc.addRule({
            id: 'bad',
            describe: () => 'throws',
            apply: () => {
                throw new Error('boom');
            },
        });
        svc.addRule({
            id: 'good',
            describe: () => 'ok',
            apply: (_obs, views) => {
                views.get('actor')!.visibleFacts['ok'] = true;
            },
        });
        const views = await svc.observe({ actorId: 'actor', step: 1, facts: {} });
        expect(views.get('actor')?.appliedRules).toEqual(['bad:error', 'good']);
        expect(views.get('actor')?.visibleFacts['ok']).toBe(true);
    });
});
