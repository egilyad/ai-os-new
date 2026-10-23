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
            'system.checkup',
            'system.describe',
            'system.diagnose',
            'system.exam',
            'system.find',
            'system.gaps',
            'system.howto',
            'system.review',
            'system.self',
        ]);
        expect(registry.groups().research).toBe(12);
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

    it('renames an agent and reads the change back', async () => {
        const store = [{ id: 'a1', name: 'Coder', role: 'coder', status: 'idle' }];
        const updateAgent = vi.fn((id: string, updates: Record<string, unknown>) => {
            const row = store.find((a) => a.id === id);
            if (!row) return;
            if (typeof updates['label'] === 'string') row.name = updates['label'];
            if (typeof updates['roleName'] === 'string') row.role = updates['roleName'];
        });
        const agents = {
            getAgents: () => store.map((a) => ({ ...a })),
            spawnAgent: vi.fn(),
            activate: vi.fn(),
            pause: vi.fn(),
            getLifecycleState: () => 'ready',
            updateAgent,
            isSystemAgent: () => false,
        };
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps({ agents })));

        const result = await registry.run('agents.update', {
            agentId: 'a1',
            label: 'Writer',
            roleName: 'writer',
        });
        expect(result.ok).toBe(true);
        expect(result.evidence).toContain('label: Coder → Writer');
        expect(result.evidence).toContain('roleName: coder → writer');
        expect(store[0].name).toBe('Writer');
    });

    it('refuses to edit built-in agents and empty changes', async () => {
        const row = { id: 'assistant', name: 'Assistant', role: 'assistant', status: 'ready' };
        const custom = { id: 'a1', name: 'Coder', role: 'coder', status: 'idle' };
        const updateAgent = vi.fn();
        const agents = {
            getAgents: () => [row, custom],
            spawnAgent: vi.fn(),
            activate: vi.fn(),
            pause: vi.fn(),
            getLifecycleState: () => 'ready',
            updateAgent,
            isSystemAgent: (id: string) => id === 'assistant',
        };
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps({ agents })));

        const builtIn = await registry.run('agents.update', { agentId: 'assistant', label: 'X' });
        expect(builtIn.ok).toBe(false);
        expect(builtIn.detail).toContain('built-in');

        const empty = await registry.run('agents.update', { agentId: 'a1' });
        expect(empty.ok).toBe(false);
        expect(empty.detail).toContain('Nothing to change');

        const unknown = await registry.run('agents.update', { agentId: 'ghost', label: 'X' });
        expect(unknown.ok).toBe(false);
        expect(unknown.detail).toContain('not found');
        expect(updateAgent).not.toHaveBeenCalled();
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
    });

    it('describes itself as an agent with a permission profile', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    self: {
                        describe: () => ({
                            id: 'assistant',
                            name: 'Project Assistant',
                            status: 'ready',
                            mode: 'guarded',
                            preset: 'guarded',
                            denials: 0,
                        }),
                    },
                }),
            ),
        );

        const result = await registry.run('system.self');
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('agent node assistant');
        expect(result.detail).toContain('guarded');
        expect(result.evidence).toContain('node: assistant');
    });

    it('looks back at its own mistakes and lessons', async () => {
        const entries = {
            mistake: [
                {
                    id: 'd1',
                    kind: 'mistake',
                    text: 'Claimed the schedule was created without reading it back',
                    evidence: 'schedule not listed',
                    timestamp: 1,
                },
            ],
            lesson: [
                {
                    id: 'd2',
                    kind: 'lesson',
                    text: 'Always read a write back before claiming success',
                    timestamp: 2,
                },
            ],
        };
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    diary: {
                        write: vi.fn(),
                        recent: vi.fn(() => []),
                        byKind: (kind: string) => entries[kind as 'mistake' | 'lesson'] ?? [],
                        count: () => 2,
                    },
                }),
            ),
        );

        const result = await registry.run('system.review', {});
        expect(result.ok).toBe(true);
        expect(result.detail).toBe('1 mistake(s), 1 lesson(s)');
        expect(result.evidence).toContain('mistake: Claimed the schedule');
        expect(result.evidence).toContain('lesson: Always read a write back');
    });

    it('says so when a mistake has no lesson yet', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    diary: {
                        write: vi.fn(),
                        recent: vi.fn(() => []),
                        byKind: (kind: string) =>
                            kind === 'mistake'
                                ? [
                                      {
                                          id: 'd1',
                                          kind: 'mistake',
                                          text: 'Guessed a provider latency',
                                          timestamp: 1,
                                      },
                                  ]
                                : [],
                        count: () => 1,
                    },
                }),
            ),
        );

        const result = await registry.run('system.review', {});
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('no lesson recorded for these mistakes yet');
        expect(result.evidence).toContain('mistake: Guessed a provider latency');
    });

    it('falls back to recent entries when byKind is not wired', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    diary: {
                        write: vi.fn(),
                        recent: vi.fn(() => [
                            { id: 'd1', kind: 'mistake', text: 'Wrong route', timestamp: 1 },
                            { id: 'd2', kind: 'answer', text: 'Fine', timestamp: 2 },
                        ]),
                    },
                }),
            ),
        );
        const result = await registry.run('system.review', {});
        expect(result.detail).toContain('1 mistake(s), 0 lesson(s)');
        expect(result.evidence).not.toContain('Fine');
    });

    it('turns a repeated mistake into a proposal, never a silent edit', async () => {
        const write = vi.fn(async () => ({ id: 'd9' }));
        const mistakes = [
            {
                id: 'd1',
                kind: 'mistake',
                text: 'Said the schedule was created without reading it back',
                tags: ['assistant', 'diary', 'mistake', 'scheduler'],
                timestamp: 1,
            },
            {
                id: 'd2',
                kind: 'mistake',
                text: 'Missed a paused schedule',
                tags: ['assistant', 'diary', 'mistake', 'scheduler'],
                timestamp: 2,
            },
        ];
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    diary: {
                        write,
                        recent: vi.fn(() => []),
                        byKind: (kind: string) =>
                            kind === 'mistake'
                                ? mistakes
                                : [
                                      {
                                          id: 'd3',
                                          kind: 'lesson',
                                          text: 'Read every schedule back',
                                          tags: ['lesson', 'scheduler'],
                                          timestamp: 3,
                                      },
                                  ],
                    },
                }),
            ),
        );

        const result = await registry.run('system.improve', {});
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('2 mistake(s)');
        expect(result.evidence).toContain('Read every schedule back (applies to: scheduler)');
        expect(write).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'decision',
                tags: ['proposal', 'improvement', 'scheduler'],
            }),
        );
    });

    it('keeps the tags a mistake was recorded with', async () => {
        const write = vi.fn(async () => ({ id: 'd1' }));
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({ diary: { write, recent: vi.fn(() => []) } }),
            ),
        );

        const result = await registry.run('diary.write', {
            kind: 'mistake',
            text: 'Missed a paused schedule',
            tags: ['scheduler', 42, '  '],
        });
        expect(result.ok).toBe(true);
        expect(write).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'mistake',
                text: 'Missed a paused schedule',
                tags: ['scheduler'],
            }),
        );
    });

    it('does not invent a pattern from a single mistake', async () => {
        const write = vi.fn();
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    diary: {
                        write,
                        recent: vi.fn(() => []),
                        byKind: () => [
                            {
                                id: 'd1',
                                kind: 'mistake',
                                text: 'Guessed once',
                                tags: ['mistake', 'providers'],
                                timestamp: 1,
                            },
                        ],
                    },
                }),
            ),
        );
        const result = await registry.run('system.improve', {});
        expect(result.ok).toBe(true);
        expect(result.detail).toBe('no repeated mistake pattern yet, nothing to propose');
        expect(write).not.toHaveBeenCalled();
    });

    it('says so when self-description is not wired', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(createAssistantActions(deps()));
        const result = await registry.run('system.self');
        expect(result.ok).toBe(false);
        expect(result.detail).toContain('not wired');
    });

    it('reports a sweep of the read capabilities as a health check', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    exam: {
                        examine: vi.fn(),
                        sweep: async () => ({
                            checked: 3,
                            passed: 2,
                            failed: 1,
                            skipped: 4,
                            verdicts: [
                                {
                                    capabilityId: 'action:system.find',
                                    passed: true,
                                    level: 'verified',
                                    evidence: ['panel memory'],
                                    reason: 'ok',
                                    nextStep: '',
                                },
                                {
                                    capabilityId: 'action:traces.summary',
                                    passed: false,
                                    level: 'discovered',
                                    evidence: [],
                                    reason: 'traces are not available',
                                    nextStep: 'check the trace service',
                                },
                            ],
                        }),
                    },
                }),
            ),
        );

        const result = await registry.run('system.checkup');
        expect(result.ok).toBe(true);
        expect(result.detail).toBe('3 checked: 2 passed, 1 failed, 4 skipped');
        expect(result.evidence).toContain('action:traces.summary: traces are not available');
    });

    it('reports declared-only and stale capabilities as gaps', async () => {
        const rows = [
            {
                id: 'panel:ghost',
                kind: 'panel',
                title: 'Ghost',
                trust: 'declared',
                evidence: ['docs only'],
                stale: false,
            },
            {
                id: 'tool:broken',
                kind: 'tool',
                title: 'Broken',
                trust: 'verified',
                evidence: ['stale: 500'],
                stale: true,
            },
            {
                id: 'action:ui.openPanel',
                kind: 'action',
                title: 'Open panel',
                trust: 'verified',
                evidence: ['ran'],
                stale: false,
            },
        ];
        const list = vi.fn(() => rows);
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    trust: {
                        list,
                        stats: () => ({
                            total: 3,
                            declared: 1,
                            discovered: 0,
                            verified: 2,
                            stale: 1,
                        }),
                    },
                }),
            ),
        );

        const result = await registry.run('system.gaps');
        expect(result.ok).toBe(true);
        expect(result.detail).toBe('1 declared-only, 1 stale');
        expect(result.evidence).toContain('declared: panel:ghost');
        expect(result.evidence).toContain('stale: tool:broken');
        expect(result.evidence).not.toContain('action:ui.openPanel');
        expect(list).toHaveBeenCalledWith({ includeStale: true });
    });

    it('says there are no gaps when the ledger is clean', async () => {
        const registry = new AssistantActionRegistry();
        registry.registerAll(
            createAssistantActions(
                deps({
                    trust: {
                        list: () => [],
                        stats: () => ({
                            total: 0,
                            declared: 0,
                            discovered: 0,
                            verified: 0,
                            stale: 0,
                        }),
                    },
                }),
            ),
        );
        const result = await registry.run('system.gaps');
        expect(result.ok).toBe(true);
        expect(result.detail).toContain('no gaps');
    });
});
