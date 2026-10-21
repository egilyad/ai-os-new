import { describe, it, expect, vi } from 'vitest';
import { ToolExposureService } from './tool-exposure-service';
import type { ToolDefinition } from '../../contracts/tool-types';
import type { IToolRunnerService } from '../../contracts/parity';

function catalogTool(id: string, overrides: Partial<ToolDefinition> = {}): ToolDefinition {
    return {
        id,
        name: id,
        type: 'api',
        category: 'utility',
        description: `catalog ${id}`,
        enabled: true,
        ...overrides,
    } as ToolDefinition;
}

function makeService(selection?: Record<string, { profileId?: string; tools?: string[]; deny?: string[] }>) {
    const execute = vi.fn(async (id: string, input: unknown) => ({ id, input }));
    const callTool = vi.fn(async (agentId: string, name: string) => `runner:${name}:${agentId}`);

    const toolService = {
        getTools: () => [
            catalogTool('t-read-file', { permissionAction: 'tool:read', group: 'group:fs' }),
            catalogTool('t-web', { permissionAction: 'tool:net', group: 'group:web' }),
            catalogTool('t-code', { permissionAction: 'tool:exec', group: 'group:code' }),
        ],
        execute,
    };

    const toolRunner = {
        listToolDefs: () => [
            {
                name: 'workspace.read',
                description: 'read a file',
                parameters: { type: 'object', properties: { path: { type: 'string' } } },
            },
            {
                name: 'http.fetch',
                description: 'fetch a url',
                parameters: { type: 'object', properties: { url: { type: 'string' } } },
            },
            { name: 'time.now', description: 'now', parameters: { type: 'object', properties: {} } },
        ],
        callTool,
    } as unknown as IToolRunnerService;

    const svc = new ToolExposureService({
        toolService,
        toolRunner,
        resolveSelection: (agentId: string) => selection?.[agentId] ?? null,
    });

    return { svc, execute, callTool };
}

describe('ToolExposureService', () => {
    it('merges both tool namespaces', () => {
        const { svc } = makeService();
        const names = svc.listAll().map((t) => t.name);
        expect(names).toContain('t-read-file');
        expect(names).toContain('workspace.read');
    });

    it('maps the runner namespace to the right permission class', () => {
        const { svc } = makeService();
        const byName = new Map(svc.listAll().map((t) => [t.name, t]));
        expect(byName.get('workspace.read')?.action).toBe('tool:read');
        expect(byName.get('http.fetch')?.action).toBe('tool:net');
        expect(byName.get('time.now')?.action).toBe('tool:read');
    });

    it('applies the agent profile — minimal sees reads only', () => {
        const { svc } = makeService({ a1: { profileId: 'minimal' } });
        const names = svc.list('a1').map((t) => t.name);
        expect(names).toContain('t-read-file');
        expect(names).toContain('workspace.read');
        expect(names).not.toContain('http.fetch');
        expect(names).not.toContain('t-code');
    });

    it('gives the full profile every tool', () => {
        const { svc } = makeService({ a1: { profileId: 'full' } });
        const names = svc.list('a1').map((t) => t.name);
        expect(names).toContain('http.fetch');
        expect(names).toContain('t-code');
    });

    it('falls back to the most restrictive profile without a selection', () => {
        const { svc } = makeService();
        const names = svc.list('unknown-agent').map((t) => t.name);
        expect(names).toContain('t-read-file');
        expect(names).not.toContain('t-code');
    });

    it('lets an explicit deny beat the profile', () => {
        const { svc } = makeService({ a1: { profileId: 'full', deny: ['http.fetch'] } });
        const names = svc.list('a1').map((t) => t.name);
        expect(names).not.toContain('http.fetch');
        expect(names).toContain('t-code');
    });

    it('dispatches to the owner of the tool', async () => {
        const { svc, execute, callTool } = makeService({ a1: { profileId: 'full' } });
        await expect(svc.invoke('a1', 't-read-file', { path: 'a.ts' })).resolves.toContain('t-read-file');
        expect(execute).toHaveBeenCalled();
        await expect(svc.invoke('a1', 'workspace.read', { path: 'a.ts' })).resolves.toBe(
            'runner:workspace.read:a1',
        );
        expect(callTool).toHaveBeenCalled();
    });

    it('refuses a tool outside the profile', async () => {
        const { svc, execute, callTool } = makeService({ a1: { profileId: 'minimal' } });
        await expect(svc.invoke('a1', 'http.fetch', { url: 'https://x.dev' })).rejects.toThrow(
            /not available/,
        );
        expect(execute).not.toHaveBeenCalled();
        expect(callTool).not.toHaveBeenCalled();
    });

    it('produces model function definitions', () => {
        const { svc } = makeService({ a1: { profileId: 'full' } });
        const defs = svc.definitions('a1');
        const read = defs.find((d) => d.function.name === 'workspace.read');
        expect(read?.type).toBe('function');
        expect(read?.function.parameters).toMatchObject({ type: 'object' });
    });
});
