// @vitest-environment node
// Pure descriptor logic — no DOM needed, so skip the jsdom bootstrap.
import { afterEach, describe, expect, it } from 'vitest';
import {
    ensurePanelActionCatalog,
    panelActionDescriptors,
    setPanelActionExtrasServices,
} from './panel-actions-catalog';
import type { PanelActionExtrasServices } from './panel-actions-catalog';
import type {
    PanelActionCatalog,
    PanelActionDescriptor,
} from '../../kernel/contracts/panel-actions';

type Prompts = PanelActionExtrasServices['prompts'];
type Versions = PanelActionExtrasServices['promptVersions'];
type Federated = PanelActionExtrasServices['federated'];

function descriptor(panelId: string, id: string): PanelActionDescriptor {
    const found = panelActionDescriptors().find((d) => d.panelId === panelId && d.id === id);
    if (!found) throw new Error(`no descriptor ${panelId}.${id}`);
    return found;
}

/** A minimal catalog: the real registry is kernel-side and covered by its own test. */
function fakeCatalog(): PanelActionCatalog & { sizes: number[] } {
    const map = new Map<string, PanelActionDescriptor>();
    return {
        sizes: [],
        register(descriptor) {
            const key = `${descriptor.panelId}.${descriptor.id}`;
            if (map.has(key)) throw new Error(`duplicate ${key}`);
            map.set(key, descriptor);
        },
        list(panelId) {
            const all = [...map.values()];
            return panelId ? all.filter((d) => d.panelId === panelId) : all;
        },
        panels() {
            return [...new Set([...map.values()].map((d) => d.panelId))].sort();
        },
        get(panelId, id) {
            return map.get(`${panelId}.${id}`);
        },
    };
}

describe('panel action catalog', () => {
    it('publishes unique verbs per panel with honest permissions', () => {
        const descriptors = panelActionDescriptors();
        const keys = descriptors.map((d) => `${d.panelId}.${d.id}`);
        expect(new Set(keys).size).toBe(keys.length);

        const panels = new Set(descriptors.map((d) => d.panelId));
        expect([...panels].sort()).toEqual([
            'agent-journal',
            'agents',
            'ai-assistants',
            'ai-employees',
            'approvals',
            'audit',
            'autonomy',
            'characters',
            'council',
            'crews',
            'crystal',
            'datasets',
            'debates',
            'diagnostics',
            'dyads',
            'eval',
            'federated-memory',
            'fleet',
            'flow-api',
            'frontier-ops',
            'governance',
            'group-chat',
            'guardrails',
            'hierarchy',
            'integrations',
            'junction',
            'knowledge',
            'knowledge-sources',
            'keys',
            'lens',
            'mcp',
            'memory',
            'memory-blocks',
            'memory-palace',
            'meta-agents',
            'mobile',
            'modes',
            'monitoring',
            'permissions',
            'policies',
            'planner',
            'projects',
            'prompt-versions',
            'prompts',
            'providers',
            'research',
            'roles',
            'run-queue',
            'safety',
            'sandbox',
            'sessions',
            'settings',
            'skill-market',
            'skills',
            'sops',
            'swe',
            'system',
            'tasks',
            'training',
            'trust',
            'web-search',
            'wiki',
            'workspace',
            'writer',
        ]);

        const writes = descriptors
            .filter((d) => d.permission === 'tool:write')
            .map((d) => `${d.panelId}.${d.id}`)
            .sort();
        expect(writes).toEqual([
            'agent-journal.remove',
            'agents.archive',
            'agents.activate',
            'agents.pause',
            'agents.spawn',
            'council.abort',
            'council.advance',
            'council.conclude',
            'council.create',
            'diagnostics.run',
            'dyads.start',
            'eval.run',
            'federated-memory.disconnect',
            'frontier-ops.charter',
            'federated-memory.sync',
            'guardrails.add-rule',
            'guardrails.check',
            'guardrails.remove-rule',
            'knowledge.remove',            'knowledge.update',
            'keys.remove',
            'keys.set-status',
            'mcp.connect',
            'mcp.disconnect',
            'memory.forget',
            'permissions.set-mode',
            'policies.add',
            'policies.remove',
            'planner.plan',
            'prompt-versions.remove',
            'prompt-versions.save',
            'prompts.create',
            'prompts.remove',
            'roles.create',
            'roles.remove',
            'sandbox.request',
            'sessions.archive',
            'sessions.delete',
            'sessions.pause',
            'sessions.resume',
            'settings.set-mode',
            'skills.install',
            'skills.toggle',
            'skill-market.install',
            'sops.run',
            'tasks.create',
            'tasks.delete',
            'tasks.set-status',
            'wiki.add-page',
            'wiki.ingest-source',
            'wiki.lint-run',
            'wiki.run-worker',
            'writer.check',
        ]);

        // The human-in-the-loop queue must never be resolvable by the assistant.
        expect(descriptors.some((d) => d.panelId === 'approvals' && d.permission === 'tool:write')).toBe(
            false,
        );
        for (const descriptor of descriptors) {
            expect(descriptor.title.length).toBeGreaterThan(0);
            expect(descriptor.description.length).toBeGreaterThan(0);
        }
    });

    it('registers once and skips duplicated mounts', () => {
        const catalog = fakeCatalog();
        const added = ensurePanelActionCatalog(catalog);
        expect(added).toBe(panelActionDescriptors().length);
        expect(ensurePanelActionCatalog(catalog)).toBe(0);
        expect(catalog.list().length).toBe(panelActionDescriptors().length);
    });
});

/** Fakes for the panels whose services live in the heavy module. */
function fakePrompts(seedBuiltIn = false): Prompts & { count(): number } {
    const items = new Map<string, Awaited<ReturnType<Prompts['getAll']>>[number] & { isBuiltIn: boolean }>();
    let n = 0;
    if (seedBuiltIn) {
        items.set('built-in', { id: 'built-in', title: 'House rules', category: 'system', usageCount: 0, isBuiltIn: true });
    }
    return {
        count: () => items.size,
        getAll: async () => [...items.values()],
        search: async (query: string) => [...items.values()].filter((p) => p.title.includes(query)),
        getById: async (id: string) => items.get(id),
        create: async (data) => {
            const created = { id: `p${++n}`, ...data, usageCount: 0, isBuiltIn: false };
            items.set(created.id, created);
            return created;
        },
        remove: async (id: string) => items.delete(id),
    };
}

function fakeFederated(
    nodes: Array<{ id: string; name: string }>,
    statuses: string[] = [],
): Federated & { connected(): string[] } {
    const list = nodes.map((n) => ({
        ...n,
        role: 'peer',
        endpoint: `https://${n.id}.local`,
        status: 'connected',
        syncedMemories: 1,
        totalMemories: 3,
    }));
    return {
        connected: () => list.map((n) => n.id),
        getNodes: () => list,
        disconnectNode: (id: string) => {
            const i = list.findIndex((n) => n.id === id);
            if (i >= 0) list.splice(i, 1);
        },
        syncAll: async () =>
            list.map((n, i) => ({
                peerNodeId: n.id,
                status: statuses[i] ?? 'completed',
                memoriesTransferred: 3,
            })),
    };
}

function fakeVersions(): Versions {
    const prompts = new Map<string, { id: string; name: string; currentVersion: number }>();
    const versions: Array<{ id: string; promptId: string; version: number; author: string; comment: string; content: string }> = [];
    let n = 0;
    return {
        getPrompts: () => [...prompts.values()],
        getVersions: (promptId: string) => versions.filter((v) => v.promptId === promptId),
        saveVersion: (promptId: string, name: string, content: string, author: string, comment: string) => {
            const meta = prompts.get(promptId) ?? { id: promptId, name, currentVersion: 0 };
            meta.currentVersion += 1;
            meta.name = name;
            prompts.set(promptId, meta);
            const version = { id: `v${++n}`, promptId, version: meta.currentVersion, author, comment, content };
            versions.push(version);
            return version;
        },
        deletePrompt: (promptId: string) => {
            prompts.delete(promptId);
            for (let i = versions.length - 1; i >= 0; i -= 1) {
                if (versions[i].promptId === promptId) versions.splice(i, 1);
            }
        },
    };
}

function fakeAudit(): PanelActionExtrasServices['audit'] {
    return { list: async () => [] };
}

function fakeResearch(): PanelActionExtrasServices['research'] {
    return { getRecentRuns: () => [] };
}

function fakeWiki(): PanelActionExtrasServices['wiki'] {
    return {
        stats: async () => ({ pages: 0, sources: 0 }),
        recentPages: async () => [],
        runLint: async () => 0,
        enqueueSource: async () => ({ sourceId: 'src-x', taskId: 'task-x' }),
        queueSummary: async () => ({ pending: 0, total: 0 }),
        search: async () => [],
        putCuratedPage: async (input) => ({ slug: input.slug }),
        runWorker: async () => ({ pending: 0, total: 0 }),
    };
}

function fakeCrews(): PanelActionExtrasServices['crews'] {
    return { list: async () => [] };
}

function fakeHierarchy(): PanelActionExtrasServices['hierarchy'] {
    return { tree: async () => [] };
}

function fakeGovernance(): PanelActionExtrasServices['governance'] {
    return { servers: async () => [], grants: async () => [] };
}

function fakeCrystal(): PanelActionExtrasServices['crystal'] {
    return { list: async () => [], search: async () => [] };
}

function fakeJunction(): PanelActionExtrasServices['junction'] {
    return { list: async () => [] };
}

function fakeLens(): PanelActionExtrasServices['lens'] {
    return { list: async () => [] };
}

function fakeMeta(): PanelActionExtrasServices['meta'] {
    return { proposals: async () => [] };
}

function fakeSandbox(): PanelActionExtrasServices['sandbox'] {
    return {
        list: async () => [],
        request: async () => ({ id: 'sb-x', status: 'pending' }),
    };
}

function fakeSkillMarket(): PanelActionExtrasServices['skillMarket'] {
    return {
        list: async () => [],
        install: async (id) => ({ id, installed: true }),
        uninstall: async (id) => ({ id, installed: false }),
    };
}

function fakeFleet(): PanelActionExtrasServices['fleet'] {
    return {
        watches: async () => [],
        watch: async () => ({ id: 'w1', status: 'watching' }),
        unwatch: async () => undefined,
    };
}

function fakeMobile(): PanelActionExtrasServices['mobile'] {
    return {
        sessions: async () => [],
        notifications: async () => [],
        notify: async () => ({ id: 'n1' }),
        markRead: async () => undefined,
    };
}

function fakeAutonomy(): PanelActionExtrasServices['autonomy'] {
    return { loops: async () => [] };
}

function fakeRunQueue(): PanelActionExtrasServices['runQueue'] {
    return { runs: async () => [], toolkits: async () => [] };
}

function fakePlanner(): PanelActionExtrasServices['planner'] {
    return {
        filters: async () => [],
        plan: async () => ({ plan: 'step 1' }),
    };
}

function fakeKnowledge(): PanelActionExtrasServices['knowledge'] {
    return { sources: async () => [] };
}

function fakeTraining(): PanelActionExtrasServices['training'] {
    return { guides: async () => [] };
}

function fakeGuardrails(): PanelActionExtrasServices['guardrails'] {
    return {
        rules: async () => [],
        check: async () => ({ ok: true, hits: [] }),
        addRule: async (input) => ({ id: 'r1', name: input.name }),
        removeRule: async () => undefined,
    };
}

function fakeSops(): PanelActionExtrasServices['sops'] {
    return {
        list: async () => [],
        run: async () => ({ id: 's1', status: 'running' }),
    };
}

function fakeModes(): PanelActionExtrasServices['modes'] {
    return { list: async () => [] };
}

function fakeMemoryBlocks(): PanelActionExtrasServices['memoryBlocks'] {
    return { blocks: async () => [] };
}

function fakeIntegrations(): PanelActionExtrasServices['integrations'] {
    return {
        catalog: async () => [],
        connections: async () => [],
        connect: async (input) => ({ id: 'i1', app: input.app, label: input.label }),
        disconnect: async () => undefined,
    };
}

function fakeDatasets(): PanelActionExtrasServices['datasets'] {
    return {
        list: async () => [],
        create: async (name) => ({ id: 'd1', name }),
    };
}

function fakeFlowApi(): PanelActionExtrasServices['flowApi'] {
    return { tokens: async () => [] };
}

function fakeCharacters(): PanelActionExtrasServices['characters'] {
    return { clients: async () => [] };
}

function fakeGroupChat(): PanelActionExtrasServices['groupChat'] {
    return { chats: async () => [] };
}

function fakeAiEmployees(): PanelActionExtrasServices['aiEmployees'] {
    return { employees: async () => [] };
}

function fakeAiAssistants(): PanelActionExtrasServices['aiAssistants'] {
    return { assistants: async () => [] };
}

function fakeWebSearch(): PanelActionExtrasServices['webSearch'] {
    return { search: async () => [] };
}

function fakeWriter(): PanelActionExtrasServices['writer'] {
    return { check: async () => ({ score: 100, issues: [] }) };
}

function fakeCouncil(): PanelActionExtrasServices['council'] {
    return {
        sessions: async () => [],
        create: async (input) => ({ id: 'c1', topic: input.topic, phase: 'proposal', status: 'active' }),
        advance: async (id) => ({ id, phase: 'debate', status: 'active' }),
        conclude: async (id) => ({ id, phase: 'completed', status: 'completed', winnerId: 'p1' }),
        abort: async () => undefined,
    };
}

function fakeEval(): PanelActionExtrasServices['eval'] {
    return {
        benchmarks: async () => [],
        runs: async () => [],
        findings: async () => [],
        run: async (benchmarkId, subject) => ({ id: 'r1', benchmarkId, subject, total: 10 }),
    };
}

function fakeFrontierOps(): PanelActionExtrasServices['frontierOps'] {
    return {
        orgs: async () => [],
        modals: async () => [],
        charter: async (input) => ({ id: 'o1', name: input.name, status: 'active' }),
    };
}

function fakeDyads(): PanelActionExtrasServices['dyads'] {
    return {
        loops: async () => [],
        start: async (input) => ({ id: 'd1', topic: input.topic, status: 'running' }),
    };
}

function fakeSwe(): PanelActionExtrasServices['swe'] {
    return { find: async () => [] };
}

describe('panel action catalog — memory and knowledge extras', () => {
    afterEach(() => setPanelActionExtrasServices(null));

    it('says honestly that the panel services are not wired', async () => {
        setPanelActionExtrasServices(null);
        // The runner (`panel.read` / `panel.act`) turns the throw into a failed
        // result, so an unwired panel fails visibly instead of pretending.
        await expect(descriptor('prompts', 'list').run({})).rejects.toThrow(/not available/i);
    });

    it('creates a prompt and reads it back from the library', async () => {
        const prompts = fakePrompts();
        setPanelActionExtrasServices({
            federated: fakeFederated([]),
            prompts,
            promptVersions: fakeVersions(),
            audit: fakeAudit(),
            research: fakeResearch(),
            wiki: fakeWiki(),
            crews: fakeCrews(),
            hierarchy: fakeHierarchy(),
            governance: fakeGovernance(),
            crystal: fakeCrystal(),
            junction: fakeJunction(),
            lens: fakeLens(),
            meta: fakeMeta(),
            sandbox: fakeSandbox(),
            skillMarket: fakeSkillMarket(),
            fleet: fakeFleet(),
            mobile: fakeMobile(),
            autonomy: fakeAutonomy(),
            runQueue: fakeRunQueue(),
            planner: fakePlanner(),
            knowledge: fakeKnowledge(),
            training: fakeTraining(),
            guardrails: fakeGuardrails(),
            sops: fakeSops(),
            modes: fakeModes(),
            memoryBlocks: fakeMemoryBlocks(),
            integrations: fakeIntegrations(),
            datasets: fakeDatasets(),
            flowApi: fakeFlowApi(),
            characters: fakeCharacters(),
            groupChat: fakeGroupChat(),
            aiEmployees: fakeAiEmployees(),
            aiAssistants: fakeAiAssistants(),
            webSearch: fakeWebSearch(),
            writer: fakeWriter(),
            council: fakeCouncil(),
            eval: fakeEval(),
            frontierOps: fakeFrontierOps(),
            dyads: fakeDyads(),
            swe: fakeSwe(),
        });

        const result = await descriptor('prompts', 'create').run({
            title: 'Triage the queue',
            content: 'Sort by deadline.',
            tags: ['ops', 7, ' '],
        });

        expect(result.ok).toBe(true);
        expect(result.detail).toContain('Triage the queue');
        expect(result.evidence).toContain('tags: ops');
        expect(prompts.count()).toBe(1);
    });

    it('refuses to delete a built-in prompt', async () => {
        setPanelActionExtrasServices({
            federated: fakeFederated([]),
            prompts: fakePrompts(true),
            promptVersions: fakeVersions(),
            audit: fakeAudit(),
            research: fakeResearch(),
            wiki: fakeWiki(),
            crews: fakeCrews(),
            hierarchy: fakeHierarchy(),
            governance: fakeGovernance(),
            crystal: fakeCrystal(),
            junction: fakeJunction(),
            lens: fakeLens(),
            meta: fakeMeta(),
            sandbox: fakeSandbox(),
            skillMarket: fakeSkillMarket(),
            fleet: fakeFleet(),
            mobile: fakeMobile(),
            autonomy: fakeAutonomy(),
            runQueue: fakeRunQueue(),
            planner: fakePlanner(),
            knowledge: fakeKnowledge(),
            training: fakeTraining(),
            guardrails: fakeGuardrails(),
            sops: fakeSops(),
            modes: fakeModes(),
            memoryBlocks: fakeMemoryBlocks(),
            integrations: fakeIntegrations(),
            datasets: fakeDatasets(),
            flowApi: fakeFlowApi(),
            characters: fakeCharacters(),
            groupChat: fakeGroupChat(),
            aiEmployees: fakeAiEmployees(),
            aiAssistants: fakeAiAssistants(),
            webSearch: fakeWebSearch(),
            writer: fakeWriter(),
            council: fakeCouncil(),
            eval: fakeEval(),
            frontierOps: fakeFrontierOps(),
            dyads: fakeDyads(),
            swe: fakeSwe(),
        });

        const result = await descriptor('prompts', 'remove').run({ id: 'built-in' });

        expect(result.ok).toBe(false);
        expect(result.detail).toMatch(/built-in/i);
    });

    it('disconnects a federation node and reads it back', async () => {
        const federated = fakeFederated([
            { id: 'north', name: 'North' },
            { id: 'south', name: 'South' },
        ]);
        setPanelActionExtrasServices({
            federated,
            prompts: fakePrompts(),
            promptVersions: fakeVersions(),
            audit: fakeAudit(),
            research: fakeResearch(),
            wiki: fakeWiki(),
            crews: fakeCrews(),
            hierarchy: fakeHierarchy(),
            governance: fakeGovernance(),
            crystal: fakeCrystal(),
            junction: fakeJunction(),
            lens: fakeLens(),
            meta: fakeMeta(),
            sandbox: fakeSandbox(),
            skillMarket: fakeSkillMarket(),
            fleet: fakeFleet(),
            mobile: fakeMobile(),
            autonomy: fakeAutonomy(),
            runQueue: fakeRunQueue(),
            planner: fakePlanner(),
            knowledge: fakeKnowledge(),
            training: fakeTraining(),
            guardrails: fakeGuardrails(),
            sops: fakeSops(),
            modes: fakeModes(),
            memoryBlocks: fakeMemoryBlocks(),
            integrations: fakeIntegrations(),
            datasets: fakeDatasets(),
            flowApi: fakeFlowApi(),
            characters: fakeCharacters(),
            groupChat: fakeGroupChat(),
            aiEmployees: fakeAiEmployees(),
            aiAssistants: fakeAiAssistants(),
            webSearch: fakeWebSearch(),
            writer: fakeWriter(),
            council: fakeCouncil(),
            eval: fakeEval(),
            frontierOps: fakeFrontierOps(),
            dyads: fakeDyads(),
            swe: fakeSwe(),
        });

        const result = await descriptor('federated-memory', 'disconnect').run({ id: 'north' });

        expect(result.ok).toBe(true);
        expect(federated.connected()).toEqual(['south']);
    });

    it('reports failures when a sync session fails', async () => {
        setPanelActionExtrasServices({
            federated: fakeFederated([{ id: 'north', name: 'North' }], ['failed']),
            prompts: fakePrompts(),
            promptVersions: fakeVersions(),
            audit: fakeAudit(),
            research: fakeResearch(),
            wiki: fakeWiki(),
            crews: fakeCrews(),
            hierarchy: fakeHierarchy(),
            governance: fakeGovernance(),
            crystal: fakeCrystal(),
            junction: fakeJunction(),
            lens: fakeLens(),
            meta: fakeMeta(),
            sandbox: fakeSandbox(),
            skillMarket: fakeSkillMarket(),
            fleet: fakeFleet(),
            mobile: fakeMobile(),
            autonomy: fakeAutonomy(),
            runQueue: fakeRunQueue(),
            planner: fakePlanner(),
            knowledge: fakeKnowledge(),
            training: fakeTraining(),
            guardrails: fakeGuardrails(),
            sops: fakeSops(),
            modes: fakeModes(),
            memoryBlocks: fakeMemoryBlocks(),
            integrations: fakeIntegrations(),
            datasets: fakeDatasets(),
            flowApi: fakeFlowApi(),
            characters: fakeCharacters(),
            groupChat: fakeGroupChat(),
            aiEmployees: fakeAiEmployees(),
            aiAssistants: fakeAiAssistants(),
            webSearch: fakeWebSearch(),
            writer: fakeWriter(),
            council: fakeCouncil(),
            eval: fakeEval(),
            frontierOps: fakeFrontierOps(),
            dyads: fakeDyads(),
            swe: fakeSwe(),
        });

        const result = await descriptor('federated-memory', 'sync').run({});

        expect(result.ok).toBe(true);
        expect(result.detail).toContain('1 failed');
        expect(result.evidence).toContain('north: failed');
    });

    it('saves a prompt version and reads the history back', async () => {
        const promptVersions = fakeVersions();
        setPanelActionExtrasServices({
            federated: fakeFederated([]),
            prompts: fakePrompts(),
            promptVersions,
            audit: fakeAudit(),
            research: fakeResearch(),
            wiki: fakeWiki(),
            crews: fakeCrews(),
            hierarchy: fakeHierarchy(),
            governance: fakeGovernance(),
            crystal: fakeCrystal(),
            junction: fakeJunction(),
            lens: fakeLens(),
            meta: fakeMeta(),
            sandbox: fakeSandbox(),
            skillMarket: fakeSkillMarket(),
            fleet: fakeFleet(),
            mobile: fakeMobile(),
            autonomy: fakeAutonomy(),
            runQueue: fakeRunQueue(),
            planner: fakePlanner(),
            knowledge: fakeKnowledge(),
            training: fakeTraining(),
            guardrails: fakeGuardrails(),
            sops: fakeSops(),
            modes: fakeModes(),
            memoryBlocks: fakeMemoryBlocks(),
            integrations: fakeIntegrations(),
            datasets: fakeDatasets(),
            flowApi: fakeFlowApi(),
            characters: fakeCharacters(),
            groupChat: fakeGroupChat(),
            aiEmployees: fakeAiEmployees(),
            aiAssistants: fakeAiAssistants(),
            webSearch: fakeWebSearch(),
            writer: fakeWriter(),
            council: fakeCouncil(),
            eval: fakeEval(),
            frontierOps: fakeFrontierOps(),
            dyads: fakeDyads(),
            swe: fakeSwe(),
        });

        const result = await descriptor('prompt-versions', 'save').run({
            promptId: 'guard',
            name: 'Guard',
            content: 'Never self-approve.',
        });

        expect(result.ok).toBe(true);
        expect(result.detail).toContain('v1');
        expect(promptVersions.getVersions('guard')).toHaveLength(1);
        expect(promptVersions.getPrompts()[0].currentVersion).toBe(1);
    });
});
