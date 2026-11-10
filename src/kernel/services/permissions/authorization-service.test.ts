import { describe, expect, it } from 'vitest';
import { AuthorizationService } from './authorization-service';

const req = (actor: string, action: string, resource: string) => ({
    actor,
    actorType: 'agent' as const,
    action,
    resource,
});

describe('AuthorizationService (SPEC_08)', () => {
    it('default deny при отсутствии правил', async () => {
        const svc = new AuthorizationService();
        const dec = await svc.evaluate(req('agent-1', 'tool:exec', 't-web'));
        expect(dec.effect).toBe('deny');
    });

    it('явное allow срабатывает', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'r1', subject: 'agent-1', action: '*', resource: '*', effect: 'allow' },
        ]);
        expect((await svc.evaluate(req('agent-1', 'anything', 'anything'))).effect).toBe('allow');
    });

    it('не-совпавший субъект → deny', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'r1', subject: 'agent-1', action: '*', resource: '*', effect: 'allow' },
        ]);
        expect((await svc.evaluate(req('agent-2', 'x', 'y'))).effect).toBe('deny');
    });

    it('wildcard-паттерны: "*" и "prefix:*"', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'r1', subject: '*', action: 'tool:exec', resource: 't-web', effect: 'allow' },
            { id: 'r2', subject: '*', action: 'tool:exec', resource: 't-mcp:*', effect: 'deny' },
        ]);
        expect((await svc.evaluate(req('any', 'tool:exec', 't-web'))).effect).toBe('allow');
        expect((await svc.evaluate(req('any', 'tool:exec', 't-mcp:local-files'))).effect).toBe('deny');
    });

    it('priority: первое совпадение (выше priority) выигрывает', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'low', subject: '*', action: '*', resource: '*', effect: 'allow', priority: 1 },
            { id: 'high', subject: '*', action: 'tool:exec', resource: 't-web', effect: 'deny', priority: 10 },
        ]);
        expect((await svc.evaluate(req('agent', 'tool:exec', 't-web'))).effect).toBe('deny');
    });

    it('disabled-правила игнорируются', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'r1', subject: '*', action: '*', resource: '*', effect: 'allow', enabled: false },
        ]);
        expect((await svc.evaluate(req('a', 'b', 'c'))).effect).toBe('deny');
    });

    it('assertAllowed бросает при deny и проходит при allow', async () => {
        const svc = new AuthorizationService();
        await svc.setRules([
            { id: 'r1', subject: '*', action: '*', resource: '*', effect: 'deny' },
        ]);
        await expect(svc.assertAllowed(req('a', 'b', 'c'))).rejects.toThrow(/denied|deny/i);

        await svc.setRules([
            { id: 'r1', subject: '*', action: '*', resource: '*', effect: 'allow' },
        ]);
        await expect(svc.assertAllowed(req('a', 'b', 'c'))).resolves.toBeUndefined();
    });

    it('onDecision уведомляет наблюдателей, не ломая решение', async () => {
        const svc = new AuthorizationService();
        let seen: string | undefined;
        const unsub = svc.onDecision((_req, dec) => {
            seen = dec.effect;
        });
        await svc.setRules([{ id: 'r1', subject: '*', action: '*', resource: '*', effect: 'allow' }]);
        const dec = await svc.evaluate(req('a', 'b', 'c'));
        expect(dec.effect).toBe('allow');
        expect(seen).toBe('allow');
        unsub();
    });
});
