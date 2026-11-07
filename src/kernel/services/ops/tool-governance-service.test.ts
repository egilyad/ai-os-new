import { describe, it, expect, vi } from 'vitest';
import { ToolGovernanceService } from './tool-governance-service';
import type { McpServer, ToolGrant } from '../../types/ops-types';

function makeRepo() {
    const servers: McpServer[] = [];
    const grants: ToolGrant[] = [];
    return {
        servers,
        grants,
        putServer: vi.fn(async (s: McpServer) => {
            const i = servers.findIndex((x) => x.id === s.id);
            if (i === -1) servers.push(s);
            else servers[i] = s;
        }),
        getServer: vi.fn(async (id: string) => servers.find((s) => s.id === id) ?? null),
        listServers: vi.fn(async () => [...servers]),
        putGrant: vi.fn(async (g: ToolGrant) => {
            grants.push(g);
        }),
        listGrants: vi.fn(async () => [...grants]),
    };
}

function makeDeps(overrides: { authz?: { effect: string } } = {}) {
    const repo = makeRepo();
    const events = { emit: vi.fn(), on: vi.fn(), onSafe: vi.fn(() => () => {}) };
    const audit = { append: vi.fn(async () => ({})) };
    const authorizationService = overrides.authz
        ? { evaluate: vi.fn(async () => overrides.authz) }
        : undefined;
    const svc = new ToolGovernanceService(
        repo as never,
        events as never,
        audit as never,
        authorizationService as never,
    );
    return { svc, repo, audit, authorizationService };
}

describe('ToolGovernanceService', () => {
    it('registerServer stores the server and audits', async () => {
        const { svc, repo, audit } = makeDeps();
        const s = await svc.registerServer({ name: 'npm', url: 'https://mcp.local', tools: ['read'] });
        expect(repo.servers).toHaveLength(1);
        expect(s.enabled).toBe(true);
        expect(audit.append).toHaveBeenCalledWith('tools', 'mcp.registered', expect.any(String), expect.any(String));
    });

    it('disabled server denies every tool under it', async () => {
        const { svc, repo } = makeDeps();
        const s = await svc.registerServer({ name: 'db', url: 'https://db.local', tools: ['query'] });
        await svc.grant('agent-1', 'db:*');
        expect(await svc.check('agent-1', 'db:query')).toBe(true);
        await svc.setServerEnabled(s.id, false);
        expect(await svc.check('agent-1', 'db:query')).toBe(false);
    });

    it('defaults to deny without grants; explicit deny wins over allow', async () => {
        const { svc } = makeDeps();
        expect(await svc.check('agent-1', 'web:fetch')).toBe(false);
        await svc.grant('agent-1', 'web:*');
        expect(await svc.check('agent-1', 'web:fetch')).toBe(true);
        await svc.grant('agent-1', 'web:fetch', false);
        expect(await svc.check('agent-1', 'web:fetch')).toBe(false);
    });

    it('authorization service deny short-circuits', async () => {
        const { svc } = makeDeps({ authz: { effect: 'deny' } });
        await svc.grant('agent-1', '*');
        expect(await svc.check('agent-1', 'web:fetch')).toBe(false);
    });
});
