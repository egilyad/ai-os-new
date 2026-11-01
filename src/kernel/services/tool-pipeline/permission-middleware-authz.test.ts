import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '../permissions/authorization-service';
import { createPermissionMiddleware } from './permission-middleware';

function mockPermissionService(decision: { effect: 'allow' | 'deny' | 'ask'; reason?: string } = { effect: 'allow' }) {
    return {
        evaluate: async () => decision,
        recordDenial: async () => {},
        resetDenials: async () => {},
    } as never;
}

describe('createPermissionMiddleware + authorizationService (SPEC_08)', () => {
    it('authz deny блокирует до permissionService', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: 'tool:exec', resource: 't-web', effect: 'deny' },
        ]);
        let permissionCalled = false;
        const perm = {
            evaluate: async () => {
                permissionCalled = true;
                return { effect: 'allow' };
            },
            recordDenial: async () => {},
            resetDenials: async () => {},
        } as never;

        const mw = createPermissionMiddleware(perm, undefined, authz);
        const dec = await mw.pre!({ agentId: 'agent-1', toolId: 't-web' } as never);
        expect(dec.kind).toBe('deny');
        expect(permissionCalled).toBe(false);
    });

    it('authz allow передаёт дальше в permissionService (ask)', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: '*', resource: '*', effect: 'allow' },
        ]);
        const perm = mockPermissionService({ effect: 'ask', reason: 'needs human' });
        const mw = createPermissionMiddleware(perm, undefined, authz);
        const dec = await mw.pre!({ agentId: 'agent-1', toolId: 't-web' } as never);
        expect(dec.kind).toBe('ask');
    });

    it('без authorizationService поведение не меняется', async () => {
        const perm = mockPermissionService({ effect: 'deny', reason: 'no' });
        const mw = createPermissionMiddleware(perm);
        const dec = await mw.pre!({ agentId: 'agent-1', toolId: 't-web' } as never);
        expect(dec.kind).toBe('deny');
        expect((dec as { reason?: string }).reason).toBe('no');
    });
});
