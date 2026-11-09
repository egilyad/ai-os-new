import { describe, expect, it } from 'vitest';
import { AuthorizationService } from './authorization-service';
import { AgentPermissionService } from './permission-service';

function mockDeps(authz?: AuthorizationService) {
    return {
        eventBus: { emit: () => {}, emitOnce: () => true },
        database: { getKv: async () => null, setKv: async () => {} },
        ...(authz ? { authorizationService: authz } : {}),
    };
}

describe('AgentPermissionService + authorizationService (SPEC_08)', () => {
    it('authz deny блокирует до ruleset', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: 'tool:exec', resource: 't-web', effect: 'deny' },
        ]);
        const svc = new AgentPermissionService(mockDeps(authz));
        const dec = await svc.evaluate('agent-1', 'tool:exec', 't-web');
        expect(dec.effect).toBe('deny');
        expect(dec.reason).toContain('authorization service');
    });

    it('authz allow не меняет дефолт ruleset (ask без правил)', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: '*', resource: '*', effect: 'allow' },
        ]);
        const svc = new AgentPermissionService(mockDeps(authz));
        const dec = await svc.evaluate('agent-1', 'tool:exec', 't-web');
        expect(dec.effect).toBe('ask');
    });

    it('без authz поведение прежнее (ask без правил)', async () => {
        const svc = new AgentPermissionService(mockDeps());
        const dec = await svc.evaluate('agent-1', 'tool:exec', 't-web');
        expect(dec.effect).toBe('ask');
    });
});
