import { describe, it, expect, vi } from 'vitest';
import { AssistantActionRegistry } from './assistant-action-registry';
import {
    createAssistantActions,
    createAssistantUiActions,
    type AssistantActionDeps,
} from './assistant-actions';
import type { ProjectKnowledgeService } from './project-knowledge-service';
import type { AssistantNavigationService } from './assistant-navigation-service';

function knowledge(overrides: Partial<ProjectKnowledgeService> = {}): ProjectKnowledgeService {
    return {
        search: vi.fn(async () => [
            { kind: 'panel', id: 'memory', title: 'Memory', score: 3, route: '/memory' },
        ]),
        context: vi.fn(async () => ({ hits: [], markdown: '' })),
        panel: vi.fn((id: string) =>
            id === 'memory'
                ? {
                      id: 'memory',
                      route: '/memory',
                      component: 'src/components/Memory/MemoryPanel.tsx',
                      article: 'wiki-memory',
                      tests: ['memory-panel.test.tsx'],
                      section: 'data',
                  }
                : null,
        ),
        connections: vi.fn((id: string) =>
            id === 'memory'
                ? {
                      panelId: 'memory',
                      route: '/memory',
                      component: 'src/components/Memory/MemoryPanel.tsx',
                      tests: ['memory-panel.test.tsx'],
                      article: 'wiki-memory',
                  }
                : null,
        ),
        article: vi.fn((slug: string) =>
            slug === 'wiki-memory'
                ? {
                      slug,
                      title: 'Memory',
                      section: 'data',
                      body: 'body',
                      freshness: 'fresh',
                  }
                : null,
        ),
        ...overrides,
    } as unknown as ProjectKnowledgeService;
}

function deps(overrides: Partial<AssistantActionDeps> = {}): AssistantActionDeps {
    return {
        knowledge: knowledge(),
        navigation: {
            open: vi.fn(async () => true),
        } as unknown as AssistantNavigationService,
        ...overrides,
    };
}

describe('AssistantActionRegistry', () => {
    it('registers actions, lists them by group and rejects duplicates', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        expect(registry.list('navigation').map((a) => a.id)).toEqual(['ui.openPanel']);
        expect(registry.list('research').map((a) => a.id)).toEqual([
            'diary.recent',
            'memory.search',
            'system.capabilities',
            'system.describe',
            'system.exam',
            'system.find',
        ]);
        expect(registry.groups().research).toBe(6);
        expect(registry.groups().work).toBeGreaterThan(0);
        expect(() => registry.register(registry.list()[0]!)).toThrow(/already registered/);
    });

    it('turns actions into function definitions', () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        const defs = registry.definitions();
        const find = defs.find((d) => d.function.name === 'system.find');
        expect(defs.every((d) => d.type === 'function')).toBe(true);
        expect(find?.function.parameters).toMatchObject({
            type: 'object',
            required: ['query'],
        });
    });

    it('returns a failed result for an unknown action and never throws', async () => {
        const registry = new AssistantActionRegistry();
        registry.register({
            id: 'boom',
            group: 'work',
            description: 'throws',
            parameters: { type: 'object', properties: {} },
            action: 'tool:read',
            run: async () => {
                throw new Error('kaboom');
            },
        });

        expect(await registry.run('nope')).toMatchObject({ ok: false });
        const thrown = await registry.run('boom');
        expect(thrown.ok).toBe(false);
        expect(thrown.detail).toContain('kaboom');
    });
});

describe('assistant actions', () => {
    it('finds panels and reports evidence', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        const result = await registry.run('system.find', { query: 'память' });
        expect(result.ok).toBe(true);
        expect(result.verification).toBe('verified');
        expect(result.evidence).toContain('panel memory');
    });

    it('describes a panel with its route, component and tests', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        const result = await registry.run('system.describe', { panelId: 'memory' });
        expect(result.ok).toBe(true);
        expect(result.evidence).toContain('MemoryPanel.tsx');
        expect(result.evidence).toContain('memory-panel.test.tsx');
    });

    it('reports navigation as failed when the interface did not confirm it', async () => {
        const navigation = { open: vi.fn(async () => false) };
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(deps({ navigation: navigation as unknown as AssistantNavigationService })),
        );

        const result = await registry.run('ui.openPanel', { panelId: 'memory' });
        expect(navigation.open).toHaveBeenCalledWith('/memory', 'Открываю панель по просьбе');
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('not confirmed');
    });

    it('opens the panel route when the interface confirms', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        const result = await registry.run('ui.openPanel', { panelId: 'memory', reason: 'test' });
        expect(result.ok).toBe(true);
        expect(result.evidence).toBe('route: /memory');
    });

    it('lists agents from the injected service', async () => {
        const agents = {
            getAgents: () => [{ id: 'a1', name: 'Coder', role: 'coder', status: 'idle' }],
            spawnAgent: vi.fn(),
            activate: vi.fn(),
            pause: vi.fn(),
            getLifecycleState: () => 'ready',
        };
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps({ agents })));

        const result = await registry.run('agents.list');
        expect(result.ok).toBe(true);
        expect(result.evidence).toContain('a1 (coder, idle)');
    });

    it('stores a fact in memory and returns the id', async () => {
        const memory = {
            recall: vi.fn(async () => []),
            store: vi.fn(async () => 'mem-1'),
        };
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps({ memory })));

        const result = await registry.run('memory.remember', { content: 'Решение: X', type: 'decision' });
        expect(result.ok).toBe(true);
        expect(result.evidence).toBe('memoryId: mem-1');
        expect(memory.store).toHaveBeenCalledWith({
            content: 'Решение: X',
            metadata: expect.objectContaining({ source: 'assistant', type: 'decision' }),
        });
    });

    it('fails cleanly when a required service is missing', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));

        const result = await registry.run('agents.list');
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('No agents');
    });

    it('registers UI-owned actions as a separate batch', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantUiActions({
                keys: {
                    getKeys: () => [{ id: 'k1', provider: 'openai', status: 'active' }],
                    checkHealth: async () => ({ id: 'k1', status: 'healthy', latency: 12 }),
                },
                mcp: {
                    listServers: async () => [
                        { id: 's1', name: 'files', status: 'connected', tools: ['read'] },
                    ],
                },
                skills: { getSkills: () => [{ name: 'review' }] },
            }),
        );

        expect((await registry.run('keys.list')).evidence).toContain('k1 (openai, active)');
        expect((await registry.run('keys.health', { keyId: 'k1' })).detail).toBe(
            'Key k1: healthy',
        );
        expect((await registry.run('mcp.list')).evidence).toContain('files (connected)');
        expect((await registry.run('skills.list')).evidence).toBe('review');
        expect((await registry.run('tasks.list')).detail).toContain('task service');
    });
});
