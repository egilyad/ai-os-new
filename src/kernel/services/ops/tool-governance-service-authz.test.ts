import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '../permissions/authorization-service';
import { ToolGovernanceService } from './tool-governance-service';

function mockRepo(servers: unknown[] = [], grants: unknown[] = []) {
    return {
        listServers: async () => servers,
        listGrants: async () => grants,
        putServer: async () => {},
        putGrant: async () => {},
        getServer: async () => null,
    } as never;
}

const mockEvents = { emit: () => {} };
const mockAudit = { append: async () => {} };

describe('ToolGovernanceService + authorizationService (SPEC_08)', () => {
    it('authz deny блокирует даже при allow-гранте', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: 'tool:exec', resource: 'mcp:x', effect: 'deny' },
        ]);
        const svc = new ToolGovernanceService(
            mockRepo([], [{ agentId: 'agent-1', pattern: '*', allow: true }]),
            mockEvents,
            mockAudit,
            authz,
        );
        expect(await svc.check('agent-1', 'mcp:x')).toBe(false);
    });

    it('authz allow сохраняет default-deny без грантов', async () => {
        const authz = new AuthorizationService();
        await authz.setRules([
            { id: 'r', subject: '*', action: '*', resource: '*', effect: 'allow' },
        ]);
        const svc = new ToolGovernanceService(
            mockRepo([], []),
            mockEvents,
            mockAudit,
            authz,
        );
        expect(await svc.check('agent-1', 'mcp:x')).toBe(false);
    });

    it('без authz поведение прежнее (default-deny)', async () => {
        const svc = new ToolGovernanceService(mockRepo([], []), mockEvents, mockAudit);
        expect(await svc.check('agent-1', 'mcp:x')).toBe(false);
    });
});
