/**
 * Panel action catalog — what the assistant can do inside each panel.
 *
 * Adding a panel here does not add a tool for the model: it adds a capability
 * reachable through `panel.list` / `panel.read` / `panel.act`. The rule for a
 * descriptor is the same as for every assistant action: read the result back
 * and report only what was observed.
 *
 * Deliberately absent: the approvals panel exposes only a read. An assistant
 * that could resolve the human-in-the-loop queue itself would be the gate
 * approving its own gate.
 */
import {
    agentJournalService,
    agentPermissionService,
    agentService,
    capabilityTrustService,
    debateService,
    diagnosticService,
    keyService,
    mcpService,
    memoryOrchestrator,
    memoryService,
    monitoringService,
    policyService,
    projectKnowledgeService,
    providerTracker,
    roleService,
    sessionManager,
    settingsService,
    skillService,
    systemStatusService,
    workspaceService,
} from '../../kernel/instances/services-core';
import { agemsApprovalService } from '../../kernel/services/agems-approval-service';
import { agemsTaskService } from '../../kernel/services/agems-task-service';
import type { AgemsTaskStatus } from '../../kernel/types/agems-task';
import type {
    PanelActionCatalog,
    PanelActionDescriptor,
} from '../../kernel/contracts/panel-actions';
import type { AssistantActionResult } from '../../kernel/contracts/assistant';

/**
 * The prompts / federation services live in a heavy module, and importing it
 * here would make every consumer of this catalog (including its unit test) wait
 * on that whole graph. Instead the wiring injects them, and the descriptors
 * whose panel is not wired say so honestly.
 */
export interface PanelActionExtrasServices {
    federated: {
        getNodes(): Array<{
            id: string;
            name: string;
            role: string;
            endpoint: string;
            status: string;
            syncedMemories: number;
            totalMemories: number;
        }>;
        disconnectNode(id: string): void;
        syncAll(): Promise<
            Array<{ peerNodeId: string; status: string; memoriesTransferred: number }>
        >;
    };
    prompts: {
        getAll(): Promise<Array<{ id: string; title: string; category: string; usageCount: number }>>;
        search(query: string): Promise<Array<{ id: string; title: string; category: string; usageCount: number }>>;
        getById(id: string): Promise<{ id: string; title: string; category: string; isBuiltIn: boolean } | undefined>;
        create(data: {
            title: string;
            content: string;
            category: string;
            tags: string[];
            variables: string[];
        }): Promise<{ id: string; title: string; category: string }>;
        remove(id: string): Promise<boolean>;
    };
    promptVersions: {
        getPrompts(): Array<{ id: string; name: string; currentVersion: number }>;
        getVersions(promptId: string): Array<{ id: string; version: number; author: string; comment: string; content: string }>;
        saveVersion(
            promptId: string,
            name: string,
            content: string,
            author: string,
            comment: string,
        ): { id: string; version: number; content: string };
        deletePrompt(promptId: string): void;
    };
    audit: {
        list(limit?: number): Promise<
            Array<{
                id: string;
                actor: string;
                action: string;
                target?: string;
                detail?: string;
                createdAt: number;
            }>
        >;
    };
    research: {
        getRecentRuns(limit?: number): Array<{
            id: string;
            module: string;
            status: string;
            startedAt: number;
            summary?: string;
        }>;
    };
    wiki: {
        stats(): Promise<{ pages: number; sources: number }>;
        recentPages(limit?: number): Promise<Array<{ slug: string; title: string; type: string }>>;
        runLint(): Promise<number>;
        enqueueSource(input: { title: string; content: string }): Promise<{ sourceId: string; taskId: string }>;
        queueSummary(): Promise<{ pending: number; total: number }>;
        search(query: string): Promise<Array<{ slug: string; title: string; snippet: string }>>;
        putCuratedPage(input: { slug: string; title: string; body: string }): Promise<{ slug: string }>;
    };
}

let extrasServices: PanelActionExtrasServices | null = null;

/** Called by the UI wiring, which owns the heavy service module. */
export function setPanelActionExtrasServices(services: PanelActionExtrasServices | null): void {
    extrasServices = services;
}

/**
 * The runner (`panel.read` / `panel.act`) turns a throw into an honest failed
 * result, so a descriptor whose panel is not wired fails visibly instead of
 * pretending.
 */
function needExtras(): PanelActionExtrasServices {
    if (!extrasServices) throw new Error('panel services are not available');
    return extrasServices;
}

function str(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function num(value: unknown, fallback: number): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function fail(detail: string): AssistantActionResult {
    return { ok: false, detail };
}

function snippet(text: string, max = 80): string {
    const one = text.replace(/\s+/g, ' ').trim();
    return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

export function panelActionDescriptors(): PanelActionDescriptor[] {
    return [
        /* ------------------------------------------------------------ memory */
        {
            panelId: 'memory',
            id: 'list',
            title: 'Recent memories',
            description: 'The newest entries of the long-term memory.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { limit: { type: 'number', description: 'How many (max 50).' } },
            },
            run: async (args) => {
                const limit = Math.min(num(args['limit'], 5), 50);
                const entries = memoryService.getMemories(limit);
                if (entries.length === 0) return { ok: true, detail: 'memory is empty', evidence: 'entries: 0', verification: 'verified' };
                return {
                    ok: true,
                    detail: `${entries.length} memor(y|ies)`,
                    evidence: entries.map((e) => `${e.id} • ${snippet(e.content)}`).join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'memory',
            id: 'search',
            title: 'Search memory',
            description: 'Search the long-term memory by text.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'What to look for.' },
                    limit: { type: 'number', description: 'How many hits (max 20).' },
                },
                required: ['query'],
            },
            run: async (args) => {
                const query = str(args['query']);
                if (!query) return fail('query is required');
                const limit = Math.min(num(args['limit'], 5), 20);
                const results = await memoryService.search(query, limit);
                if (results.length === 0) {
                    return { ok: true, detail: `no memory matches "${query}"`, evidence: 'hits: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${results.length} hit(s) for "${query}"`,
                    evidence: results
                        .map((r) => `${r.entry.id} (${r.matchedOn}, ${r.score.toFixed(2)}) • ${snippet(r.entry.content)}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'memory',
            id: 'stats',
            title: 'Memory stats',
            description: 'How much the memory holds and what kinds of entries.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const stats = memoryService.getStats();
                const types = Object.entries(stats.byType)
                    .map(([type, count]) => `${type}: ${count}`)
                    .join(', ');
                return {
                    ok: true,
                    detail: `${stats.totalEntries} entr(y|ies), ${stats.uniqueSources} source(s)`,
                    evidence: `tokens: ${stats.totalTokens} | types: ${types || 'none'} | avg importance: ${stats.avgImportance.toFixed(2)}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'memory',
            id: 'forget',
            title: 'Forget one memory',
            description: 'Delete a single memory entry by id. Used when the user asks to forget something.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Memory id (see list/search).' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = memoryService.getMemory(id);
                if (!before) return fail(`memory ${id} does not exist`);
                await memoryService.deleteMemory(id);
                // A deletion that still finds the entry did not happen.
                if (memoryService.getMemory(id)) return fail(`memory ${id} is still there`);
                return {
                    ok: true,
                    detail: `Forgot memory ${id}`,
                    evidence: `deleted: ${id} | content: ${snippet(before.content)}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------ agent-journal */
        {
            panelId: 'agent-journal',
            id: 'recent',
            title: 'Recent journal entries',
            description: 'What the agents actually did, newest first.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    limit: { type: 'number', description: 'How many (max 50).' },
                    agentId: { type: 'string', description: 'Only this agent (optional).' },
                },
            },
            run: async (args) => {
                const limit = Math.min(num(args['limit'], 5), 50);
                const agentId = str(args['agentId']);
                const all = agentId
                    ? agentJournalService.listByAgent(agentId)
                    : agentJournalService.listAll();
                const entries = all.slice(0, limit);
                if (entries.length === 0) {
                    return { ok: true, detail: agentId ? `no journal entries for "${agentId}"` : 'the journal is empty', evidence: 'entries: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${entries.length} journal entr(y|ies)`,
                    evidence: entries
                        .map((e) => `${e.agentId} ${e.outcome} ${e.taskType}: ${snippet(e.taskDescription)}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'agent-journal',
            id: 'remove',
            title: 'Delete a journal entry',
            description: 'Remove one journal entry by id.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Entry id (see recent).' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = agentJournalService.listAll().find((e) => e.id === id);
                if (!before) return fail(`journal entry ${id} does not exist`);
                await agentJournalService.remove(id);
                if (agentJournalService.listAll().some((e) => e.id === id)) {
                    return fail(`journal entry ${id} is still there`);
                }
                return {
                    ok: true,
                    detail: `Deleted journal entry ${id}`,
                    evidence: `deleted: ${id} | task: ${before.taskType}`,
                    verification: 'verified',
                };
            },
        },

        /* ---------------------------------------------------------- approvals */
        {
            panelId: 'approvals',
            id: 'pending',
            title: 'Pending approvals',
            description: 'What waits for a human decision. Read-only by design: the assistant must not resolve its own gate.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const pending = await agemsApprovalService.list(undefined, 'PENDING');
                if (pending.length === 0) {
                    return { ok: true, detail: 'nothing waits for approval', evidence: 'pending: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${pending.length} pending approval(s)`,
                    evidence: pending
                        .slice(0, 10)
                        .map((p) => `#${p.id} ${p.toolName} (${p.agentId})`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ---------------------------------------------------------- knowledge */
        {
            panelId: 'knowledge',
            id: 'graph',
            title: 'Knowledge graph size',
            description: 'How many memories the knowledge graph is built from, and of what kinds.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const stats = memoryService.getStats();
                const types = Object.entries(stats.byType)
                    .map(([type, count]) => `${type}: ${count}`)
                    .join(', ');
                return {
                    ok: true,
                    detail: `${stats.totalEntries} node(s) from ${stats.uniqueSources} source(s)`,
                    evidence: `types: ${types || 'none'} | tokens: ${stats.totalTokens}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'knowledge',
            id: 'update',
            title: 'Rewrite a knowledge node',
            description: 'Replace the content of one memory (node of the graph) and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Memory id.' },
                    content: { type: 'string', description: 'The new content.' },
                },
                required: ['id', 'content'],
            },
            run: async (args) => {
                const id = str(args['id']);
                const content = str(args['content']);
                if (!id) return fail('id is required');
                if (!content) return fail('content is required');
                const before = memoryService.getMemory(id);
                if (!before) return fail(`knowledge node ${id} does not exist`);
                await memoryService.updateMemory(id, content);
                const after = memoryService.getMemory(id);
                if (!after || after.content !== content) {
                    return fail(`knowledge node ${id} did not change`);
                }
                return {
                    ok: true,
                    detail: `Rewrote knowledge node ${id}`,
                    evidence: `before: ${snippet(before.content)} | after: ${snippet(after.content)}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'knowledge',
            id: 'remove',
            title: 'Remove a knowledge node',
            description: 'Delete one memory from the knowledge graph by id.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Memory id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = memoryService.getMemory(id);
                if (!before) return fail(`knowledge node ${id} does not exist`);
                await memoryService.deleteMemory(id);
                if (memoryService.getMemory(id)) return fail(`knowledge node ${id} is still there`);
                return {
                    ok: true,
                    detail: `Removed knowledge node ${id}`,
                    evidence: `deleted: ${id} | content: ${snippet(before.content)}`,
                    verification: 'verified',
                };
            },
        },

        /* ----------------------------------------------------- memory-palace */
        {
            panelId: 'memory-palace',
            id: 'state',
            title: 'Palace rooms',
            description: 'The rooms of the memory palace and how many entries each holds.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const state = await memoryOrchestrator.getPalaceState();
                if (state.rooms.length === 0) {
                    return { ok: true, detail: 'the palace has no rooms', evidence: 'rooms: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${state.rooms.length} room(s), ${state.totalEntries} entr(y|ies)`,
                    evidence: state.rooms
                        .map((r) => `${r.name} (${r.store}): ${r.entryCount}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'memory-palace',
            id: 'room',
            title: 'One palace room',
            description: 'Details of a single room of the memory palace by id.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Room id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const state = await memoryOrchestrator.getPalaceState();
                const room = state.rooms.find((r) => r.id === id);
                if (!room) return fail(`palace room ${id} does not exist`);
                return {
                    ok: true,
                    detail: `${room.name}: ${room.entryCount} entr(y|ies)`,
                    evidence: `${room.id} (${room.store}) — ${room.description}`,
                    verification: 'verified',
                };
            },
        },

        /* --------------------------------------------------- federated-memory */
        {
            panelId: 'federated-memory',
            id: 'nodes',
            title: 'Federation nodes',
            description: 'The connected peers of the federated memory and their sync state.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const federatedMemoryService = needExtras().federated;
                const nodes = federatedMemoryService.getNodes();
                if (nodes.length === 0) {
                    return { ok: true, detail: 'no federation nodes', evidence: 'nodes: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${nodes.length} node(s)`,
                    evidence: nodes
                        .map((n) => `${n.id} ${n.name} (${n.role}, ${n.status}) ${n.syncedMemories}/${n.totalMemories}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'federated-memory',
            id: 'disconnect',
            title: 'Disconnect a node',
            description: 'Drop one federation peer by id.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Node id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const federatedMemoryService = needExtras().federated;
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = federatedMemoryService.getNodes().find((n) => n.id === id);
                if (!before) return fail(`federation node ${id} does not exist`);
                federatedMemoryService.disconnectNode(id);
                if (federatedMemoryService.getNodes().some((n) => n.id === id)) {
                    return fail(`federation node ${id} is still connected`);
                }
                return {
                    ok: true,
                    detail: `Disconnected ${before.name}`,
                    evidence: `disconnected: ${id} | endpoint: ${before.endpoint}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'federated-memory',
            id: 'sync',
            title: 'Sync with the peers',
            description: 'Run a sync session with every connected federation node and report what moved.',
            permission: 'tool:write',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const federatedMemoryService = needExtras().federated;
                const sessions = await federatedMemoryService.syncAll();
                if (sessions.length === 0) {
                    return { ok: true, detail: 'nothing to sync (no nodes)', evidence: 'sessions: 0', verification: 'verified' };
                }
                const moved = sessions.reduce((sum, s) => sum + s.memoriesTransferred, 0);
                const failed = sessions.filter((s) => s.status === 'failed').length;
                return {
                    ok: true,
                    detail: `${sessions.length} sync session(s), ${moved} memor(y|ies) moved${failed ? `, ${failed} failed` : ''}`,
                    evidence: sessions
                        .slice(0, 10)
                        .map((s) => `${s.peerNodeId}: ${s.status} (${s.memoriesTransferred})`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------------ prompts */
        {
            panelId: 'prompts',
            id: 'list',
            title: 'Prompt templates',
            description: 'The prompt library, optionally filtered by a query.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search text (optional).' },
                    limit: { type: 'number', description: 'How many (max 20).' },
                },
            },
            run: async (args) => {
                const promptLibraryService = needExtras().prompts;
                const query = str(args['query']);
                const limit = Math.min(num(args['limit'], 5), 20);
                const all = query
                    ? await promptLibraryService.search(query)
                    : await promptLibraryService.getAll();
                const shown = all.slice(0, limit);
                if (shown.length === 0) {
                    return { ok: true, detail: query ? `no prompt matches "${query}"` : 'the prompt library is empty', evidence: 'prompts: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${shown.length} of ${all.length} prompt(s)`,
                    evidence: shown
                        .map((p) => `${p.id} • ${p.title} [${p.category}] uses: ${p.usageCount}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'prompts',
            id: 'create',
            title: 'Add a prompt template',
            description: 'Create a prompt in the library and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Short title.' },
                    content: { type: 'string', description: 'The prompt body.' },
                    category: { type: 'string', description: 'Category (default: custom).' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Tags.' },
                },
                required: ['title', 'content'],
            },
            run: async (args) => {
                const promptLibraryService = needExtras().prompts;
                const title = str(args['title']);
                const content = str(args['content']);
                if (!title) return fail('title is required');
                if (!content) return fail('content is required');
                const rawTags = args['tags'];
                const tags = Array.isArray(rawTags)
                    ? rawTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
                    : [];
                const created = await promptLibraryService.create({
                    title,
                    content,
                    category: str(args['category']) || 'custom',
                    tags,
                    variables: [],
                });
                const stored = await promptLibraryService.getById(created.id);
                if (!stored) return fail(`prompt ${created.id} was not stored`);
                return {
                    ok: true,
                    detail: `Created prompt "${stored.title}"`,
                    evidence: `id: ${stored.id} | category: ${stored.category} | tags: ${tags.join(',') || 'none'}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'prompts',
            id: 'remove',
            title: 'Delete a prompt template',
            description: 'Remove a prompt from the library by id. Built-in prompts cannot be removed.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Prompt id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const promptLibraryService = needExtras().prompts;
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = await promptLibraryService.getById(id);
                if (!before) return fail(`prompt ${id} does not exist`);
                if (before.isBuiltIn) return fail(`prompt ${id} is built-in and cannot be removed`);
                const removed = await promptLibraryService.remove(id);
                if (!removed) return fail(`prompt ${id} was not removed`);
                if (await promptLibraryService.getById(id)) return fail(`prompt ${id} is still there`);
                return {
                    ok: true,
                    detail: `Deleted prompt "${before.title}"`,
                    evidence: `deleted: ${id} | category: ${before.category}`,
                    verification: 'verified',
                };
            },
        },

        /* --------------------------------------------------- prompt-versions */
        {
            panelId: 'prompt-versions',
            id: 'list',
            title: 'Prompts with versions',
            description: 'Prompts that have version history, with the current version number.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const promptVersionService = needExtras().promptVersions;
                const prompts = promptVersionService.getPrompts();
                if (prompts.length === 0) {
                    return { ok: true, detail: 'no versioned prompts', evidence: 'prompts: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${prompts.length} versioned prompt(s)`,
                    evidence: prompts
                        .map((p) => `${p.id} • ${p.name} v${p.currentVersion}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'prompt-versions',
            id: 'history',
            title: 'Version history of a prompt',
            description: 'The saved versions of one prompt, newest first.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { promptId: { type: 'string', description: 'Prompt id.' } },
                required: ['promptId'],
            },
            run: async (args) => {
                const promptVersionService = needExtras().promptVersions;
                const promptId = str(args['promptId']);
                if (!promptId) return fail('promptId is required');
                const versions = promptVersionService.getVersions(promptId);
                if (versions.length === 0) {
                    return fail(`prompt ${promptId} has no versions`);
                }
                return {
                    ok: true,
                    detail: `${versions.length} version(s) of ${promptId}`,
                    evidence: versions
                        .slice(0, 5)
                        .map((v) => `v${v.version} by ${v.author}: ${snippet(v.comment || v.content)}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'prompt-versions',
            id: 'save',
            title: 'Save a new version',
            description: 'Snapshot a prompt body as a new version and read the history back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    promptId: { type: 'string', description: 'Prompt id (created if new).' },
                    name: { type: 'string', description: 'Prompt name.' },
                    content: { type: 'string', description: 'The prompt body.' },
                    comment: { type: 'string', description: 'Why this version exists.' },
                },
                required: ['promptId', 'name', 'content'],
            },
            run: async (args) => {
                const promptVersionService = needExtras().promptVersions;
                const promptId = str(args['promptId']);
                const name = str(args['name']);
                const content = str(args['content']);
                if (!promptId) return fail('promptId is required');
                if (!name) return fail('name is required');
                if (!content) return fail('content is required');
                const saved = promptVersionService.saveVersion(
                    promptId,
                    name,
                    content,
                    'assistant',
                    str(args['comment']) || 'saved by the assistant',
                );
                const history = promptVersionService.getVersions(promptId);
                if (!history.some((v) => v.id === saved.id)) {
                    return fail(`version ${saved.id} was not stored`);
                }
                return {
                    ok: true,
                    detail: `Saved v${saved.version} of ${promptId}`,
                    evidence: `version: ${saved.id} | versions now: ${history.length} | content: ${snippet(saved.content)}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'prompt-versions',
            id: 'remove',
            title: 'Delete a versioned prompt',
            description: 'Delete one prompt together with its version history.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { promptId: { type: 'string', description: 'Prompt id.' } },
                required: ['promptId'],
            },
            run: async (args) => {
                const promptVersionService = needExtras().promptVersions;
                const promptId = str(args['promptId']);
                if (!promptId) return fail('promptId is required');
                const before = promptVersionService.getPrompts().find((p) => p.id === promptId);
                if (!before) return fail(`versioned prompt ${promptId} does not exist`);
                promptVersionService.deletePrompt(promptId);
                if (promptVersionService.getPrompts().some((p) => p.id === promptId)) {
                    return fail(`versioned prompt ${promptId} is still there`);
                }
                return {
                    ok: true,
                    detail: `Deleted "${before.name}" and its ${before.currentVersion} version(s)`,
                    evidence: `deleted: ${promptId}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------------ agents */
        {
            panelId: 'agents',
            id: 'list',
            title: 'Agents in the topology',
            description: 'Every agent and router node, with its role and lifecycle status.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const agents = agentService.getAgents();
                if (agents.length === 0) {
                    return { ok: true, detail: 'no agents in the topology', evidence: 'agents: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${agents.length} agent(s)`,
                    evidence: agents
                        .map((a) => `${a.id} ${a.name} (${a.role}) [${a.status}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'agents',
            id: 'pause',
            title: 'Pause an agent',
            description: 'Stop one agent node and read back the paused status.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Agent id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = agentService.getAgents().find((a) => a.id === id);
                if (!before) return fail(`agent ${id} does not exist`);
                agentService.pause(id);
                const after = agentService.getAgents().find((a) => a.id === id);
                if (after && after.status === 'paused') {
                    return {
                        ok: true,
                        detail: `Paused ${before.name}`,
                        evidence: `${id}: ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`agent ${id} is still ${after?.status ?? 'unknown'}`);
            },
        },
        {
            panelId: 'agents',
            id: 'activate',
            title: 'Activate an agent',
            description: 'Resume one agent node and read back its lifecycle status.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Agent id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = agentService.getAgents().find((a) => a.id === id);
                if (!before) return fail(`agent ${id} does not exist`);
                agentService.activate(id);
                const after = agentService.getAgents().find((a) => a.id === id);
                if (after && after.status !== 'paused') {
                    return {
                        ok: true,
                        detail: `Activated ${before.name}`,
                        evidence: `${id}: ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`agent ${id} did not leave the paused state`);
            },
        },
        {
            panelId: 'agents',
            id: 'archive',
            title: 'Archive an agent',
            description: 'Take one agent node out of service and read back its status.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Agent id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = agentService.getAgents().find((a) => a.id === id);
                if (!before) return fail(`agent ${id} does not exist`);
                agentService.archive(id);
                const after = agentService.getAgents().find((a) => a.id === id);
                if (after && after.status !== before.status && after.status !== 'paused') {
                    return {
                        ok: true,
                        detail: `Archived ${before.name}`,
                        evidence: `${id}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`agent ${id} is still ${after?.status ?? 'unknown'}`);
            },
        },
        {
            panelId: 'agents',
            id: 'spawn',
            title: 'Spawn a child agent',
            description: 'Create a child agent under a parent and read it back from the topology.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    parentId: { type: 'string', description: 'Parent agent id.' },
                    name: { type: 'string', description: 'Name of the new agent.' },
                },
                required: ['parentId', 'name'],
            },
            run: async (args) => {
                const parentId = str(args['parentId']);
                const name = str(args['name']);
                if (!parentId) return fail('parentId is required');
                if (!name) return fail('name is required');
                const before = agentService.getAgents().find((a) => a.id === parentId);
                if (!before) return fail(`parent agent ${parentId} does not exist`);
                const id = agentService.spawn(parentId, { name });
                if (!id) return fail('the child agent was not created');
                const created = agentService.getAgents().find((a) => a.id === id);
                if (!created) return fail(`child agent ${id} was not stored`);
                return {
                    ok: true,
                    detail: `Spawned "${created.name}" under ${before.name}`,
                    evidence: `${id} | child of ${parentId}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------- providers */
        {
            panelId: 'providers',
            id: 'rankings',
            title: 'Provider rankings',
            description: 'Providers scored by reliability and latency, with a recommendation.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const rankings = providerTracker.getProviderRankings();
                if (rankings.length === 0) {
                    return { ok: true, detail: 'no provider activity yet', evidence: 'providers: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${rankings.length} provider(s)`,
                    evidence: rankings
                        .slice(0, 10)
                        .map((r) => `${r.provider} score ${r.score.toFixed(2)} [${r.recommendation}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'providers',
            id: 'health',
            title: 'Provider health events',
            description: 'Recent health events per provider, newest first.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    provider: { type: 'string', description: 'Provider id (optional).' },
                },
            },
            run: async (args) => {
                const provider = str(args['provider']) || undefined;
                const events = providerTracker.getHealthEvents(provider, 20);
                if (events.length === 0) {
                    return { ok: true, detail: 'no health events recorded', evidence: 'events: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${events.length} health event(s)`,
                    evidence: events
                        .map((e) => `${e.provider}: ${e.type}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------------ keys */
        {
            panelId: 'keys',
            id: 'list',
            title: 'Stored API keys',
            description: 'Every stored key: provider, label and status. Never the secret itself.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const keys = keyService.getKeys();
                if (keys.length === 0) {
                    return { ok: true, detail: 'no API keys stored', evidence: 'keys: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${keys.length} key(s)`,
                    evidence: keys
                        .map((k) => `${k.id} ${k.provider}/${k.label || 'unlabelled'} [${k.status}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'keys',
            id: 'set-status',
            title: 'Set a key status',
            description: 'Mark a stored key active, inactive, or in one of the known states, and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Key id.' },
                    status: { type: 'string', description: 'One of active, inactive, error, pending, quota_exhausted, invalid, quarantined, probation, compromised.' },
                },
                required: ['id', 'status'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const status = str(args['status']);
                const allowed = ['active', 'inactive', 'error', 'pending', 'quota_exhausted', 'invalid', 'quarantined', 'probation', 'compromised'] as const;
                const normalized = allowed.find((s) => s === status);
                if (!normalized) return fail(`unsupported status "${status}"`);
                const before = keyService.getKeys().find((k) => k.id === id);
                if (!before) return fail(`key ${id} does not exist`);
                await keyService.updateKeyStatus(id, normalized);
                const after = keyService.getKeys().find((k) => k.id === id);
                if (after && after.status === normalized) {
                    return {
                        ok: true,
                        detail: `Key ${before.provider}/${before.label || id} is now ${after.status}`,
                        evidence: `${id}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`key ${id} did not change status`);
            },
        },
        {
            panelId: 'keys',
            id: 'remove',
            title: 'Remove a key',
            description: 'Delete a stored key by id and read the store back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Key id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = keyService.getKeys().find((k) => k.id === id);
                if (!before) return fail(`key ${id} does not exist`);
                await keyService.removeKey(id);
                if (keyService.getKeys().some((k) => k.id === id)) {
                    return fail(`key ${id} is still there`);
                }
                return {
                    ok: true,
                    detail: `Removed the ${before.provider} key${before.label ? ` "${before.label}"` : ''}`,
                    evidence: `removed: ${id}`,
                    verification: 'verified',
                };
            },
        },

        /* ----------------------------------------------------------- system */
        {
            panelId: 'system',
            id: 'status',
            title: 'System status',
            description: 'Overall readiness, per-area status and active warnings.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const report = systemStatusService.getStatus();
                const areas = Object.entries(report.areas)
                    .map(([area, value]) => `${area}: ${value}`)
                    .join(', ');
                return {
                    ok: true,
                    detail: report.summary,
                    evidence: `status: ${report.status} | ${areas} | warnings: ${report.warnings.length}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------------ tasks */
        {
            panelId: 'tasks',
            id: 'list',
            title: 'Task board',
            description: 'The open work on the board, optionally filtered by status or assignee.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', description: 'Filter by status (optional).' },
                    assigneeId: { type: 'string', description: 'Filter by assignee (optional).' },
                },
            },
            run: async (args) => {
                const status = str(args['status']) || undefined;
                const assigneeId = str(args['assigneeId']) || undefined;
                const tasks = await agemsTaskService.list({ status: status as AgemsTaskStatus | undefined, assigneeId });
                if (tasks.length === 0) {
                    return { ok: true, detail: 'no tasks on the board', evidence: 'tasks: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${tasks.length} task(s)`,
                    evidence: tasks
                        .slice(0, 10)
                        .map((t) => `${t.id} ${t.title} [${t.status}]${t.assigneeId ? ` → ${t.assigneeId}` : ''}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'tasks',
            id: 'set-status',
            title: 'Move a task',
            description: 'Change one task status and read the board back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Task id.' },
                    status: { type: 'string', description: 'PENDING, IN_PROGRESS, IN_REVIEW, IN_TESTING, VERIFIED, AWAITING_APPROVAL, COMPLETED, FAILED, BLOCKED, CANCELLED.' },
                },
                required: ['id', 'status'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const status = str(args['status']) as AgemsTaskStatus;
                const allowed: AgemsTaskStatus[] = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'IN_TESTING', 'VERIFIED', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'BLOCKED', 'CANCELLED'];
                if (!allowed.includes(status)) return fail(`unsupported status "${status}"`);
                const before = (await agemsTaskService.list()).find((t) => t.id === id);
                if (!before) return fail(`task ${id} does not exist`);
                const updated = await agemsTaskService.updateStatus(id, status);
                if (!updated || updated.status !== status) {
                    return fail(`task ${id} did not move to ${status}`);
                }
                return {
                    ok: true,
                    detail: `Task "${before.title}" → ${updated.status}`,
                    evidence: `${id}: ${before.status} → ${updated.status}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------ monitoring */
        {
            panelId: 'monitoring',
            id: 'health',
            title: 'System health',
            description: 'The overall health score and the active issues behind it.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const health = monitoringService.getSystemHealth();
                return {
                    ok: true,
                    detail: `System health: ${health.status} (score ${health.score})`,
                    evidence: `issues: ${health.issues.length} | ${health.issues.join(' | ')}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'monitoring',
            id: 'providers',
            title: 'Provider health summary',
            description: 'Per-provider reliability and latency as the monitoring layer sees it.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const rows = monitoringService.getProviderHealthSummary();
                if (rows.length === 0) {
                    return { ok: true, detail: 'no provider metrics yet', evidence: 'providers: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${rows.length} provider(s)`,
                    evidence: rows
                        .slice(0, 10)
                        .map((p) => `${p.id} [${p.status}] ${Math.round(p.reliability * 100)}% reliable, avg ${Math.round(p.avgLatency)} ms`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ---------------------------------------------------- diagnostics */
        {
            panelId: 'diagnostics',
            id: 'system',
            title: 'System diagnostic',
            description: 'The diagnostic service verdict: health, score and active issues.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const diagnostic = diagnosticService.getSystemDiagnostic();
                return {
                    ok: true,
                    detail: `Diagnostic: ${diagnostic.health} (score ${diagnostic.score})`,
                    evidence: `issues: ${diagnostic.activeIssueCount} | sessions: ${diagnostic.sessionCount} | providers: ${diagnostic.providerCount}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'diagnostics',
            id: 'history',
            title: 'Diagnostic history',
            description: 'The latest diagnostic runs, newest first.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const records = diagnosticService.getDiagnosticHistory(10);
                if (records.length === 0) {
                    return { ok: true, detail: 'no diagnostic runs yet', evidence: 'runs: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${records.length} diagnostic run(s)`,
                    evidence: records
                        .map((r) => `${r.scope}: ${r.health} (score ${r.score}, ${r.issueCount} issues)`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'diagnostics',
            id: 'run',
            title: 'Run a diagnostic',
            description: 'Run a system diagnostic and report the fresh verdict.',
            permission: 'tool:write',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const record = await diagnosticService.runDiagnostic('system');
                return {
                    ok: true,
                    detail: `Diagnostic run: ${record.health} (score ${record.score})`,
                    evidence: `${record.scope} | issues: ${record.issueCount} | run: ${record.id}`,
                    verification: 'verified',
                };
            },
        },

        /* ----------------------------------------------------------- skills */
        {
            panelId: 'skills',
            id: 'list',
            title: 'Cognitive skills',
            description: 'The installed and available skills, with their state.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const skills = skillService.getSkills();
                if (skills.length === 0) {
                    return { ok: true, detail: 'no skills', evidence: 'skills: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${skills.length} skill(s)`,
                    evidence: skills
                        .slice(0, 10)
                        .map((s) => `${s.id} ${s.name} [${s.status}] runs: ${s.executionCount}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'skills',
            id: 'toggle',
            title: 'Toggle a skill',
            description: 'Switch one skill on or off and read the new state back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Skill id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = skillService.getSkills().find((s) => s.id === id);
                if (!before) return fail(`skill ${id} does not exist`);
                await skillService.toggleActive(id);
                const after = skillService.getSkills().find((s) => s.id === id);
                if (after && after.status !== before.status) {
                    return {
                        ok: true,
                        detail: `Skill "${before.name}" is now ${after.status}`,
                        evidence: `${id}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`skill ${id} did not change state`);
            },
        },
        {
            panelId: 'skills',
            id: 'install',
            title: 'Install a skill',
            description: 'Install an available skill and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Skill id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = skillService.getSkills().find((s) => s.id === id);
                if (!before) return fail(`skill ${id} does not exist`);
                await skillService.installSkill(id);
                const after = skillService.getSkills().find((s) => s.id === id);
                if (after && after.status !== 'not_installed') {
                    return {
                        ok: true,
                        detail: `Installed "${after.name}"`,
                        evidence: `${id}: ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`skill ${id} was not installed`);
            },
        },

        /* ------------------------------------------------------------- mcp */
        {
            panelId: 'mcp',
            id: 'servers',
            title: 'MCP servers',
            description: 'The configured Model Context Protocol servers and their connection state.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const servers = mcpService.getServers();
                if (servers.length === 0) {
                    return { ok: true, detail: 'no MCP servers', evidence: 'servers: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${servers.length} server(s)`,
                    evidence: servers
                        .map((s) => `${s.id} ${s.name} [${s.status}] ${s.url}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'mcp',
            id: 'connect',
            title: 'Connect an MCP server',
            description: 'Connect one MCP server and read the connection state back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { serverId: { type: 'string', description: 'Server id.' } },
                required: ['serverId'],
            },
            run: async (args) => {
                const serverId = str(args['serverId']);
                if (!serverId) return fail('serverId is required');
                const before = mcpService.getServers().find((s) => s.id === serverId);
                if (!before) return fail(`MCP server ${serverId} does not exist`);
                await mcpService.connect(serverId);
                const after = mcpService.getServers().find((s) => s.id === serverId);
                if (after && after.status === 'connected') {
                    return {
                        ok: true,
                        detail: `Connected "${after.name}"`,
                        evidence: `${serverId}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`server ${serverId} did not connect (${after?.status ?? 'unknown'})`);
            },
        },
        {
            panelId: 'mcp',
            id: 'disconnect',
            title: 'Disconnect an MCP server',
            description: 'Disconnect one MCP server and read the state back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { serverId: { type: 'string', description: 'Server id.' } },
                required: ['serverId'],
            },
            run: async (args) => {
                const serverId = str(args['serverId']);
                if (!serverId) return fail('serverId is required');
                const before = mcpService.getServers().find((s) => s.id === serverId);
                if (!before) return fail(`MCP server ${serverId} does not exist`);
                await mcpService.disconnect(serverId);
                const after = mcpService.getServers().find((s) => s.id === serverId);
                if (after && after.status === 'disconnected') {
                    return {
                        ok: true,
                        detail: `Disconnected "${before.name}"`,
                        evidence: `${serverId}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`server ${serverId} did not disconnect (${after?.status ?? 'unknown'})`);
            },
        },
        {
            panelId: 'mcp',
            id: 'resources',
            title: 'MCP resources',
            description: 'The resources one MCP server exposes.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { serverId: { type: 'string', description: 'Server id.' } },
                required: ['serverId'],
            },
            run: async (args) => {
                const serverId = str(args['serverId']);
                if (!serverId) return fail('serverId is required');
                const resources = await mcpService.listResources(serverId);
                if (resources.length === 0) {
                    return { ok: true, detail: 'no resources on this server', evidence: 'resources: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${resources.length} resource(s)`,
                    evidence: resources
                        .slice(0, 10)
                        .map((r) => `${r.uri} ${r.name}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'mcp',
            id: 'tools',
            title: 'MCP tools',
            description: 'The tools one MCP server exposes.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { serverId: { type: 'string', description: 'Server id.' } },
                required: ['serverId'],
            },
            run: async (args) => {
                const serverId = str(args['serverId']);
                if (!serverId) return fail('serverId is required');
                const tools = await mcpService.listTools(serverId);
                if (tools.length === 0) {
                    return { ok: true, detail: 'no tools on this server', evidence: 'tools: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${tools.length} tool(s)`,
                    evidence: tools
                        .slice(0, 10)
                        .map((t) => `${t.name}${t.description ? ` — ${snippet(t.description)}` : ''}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* -------------------------------------------------------- sessions */
        {
            panelId: 'sessions',
            id: 'list',
            title: 'Sessions',
            description: 'The saved chat and debate sessions with their status.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const sessions = await sessionManager.list({});
                if (sessions.length === 0) {
                    return { ok: true, detail: 'no sessions', evidence: 'sessions: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${sessions.length} session(s)`,
                    evidence: sessions
                        .slice(0, 10)
                        .map((s) => `${s.id} ${s.title} [${s.type}:${s.status}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'sessions',
            id: 'pause',
            title: 'Pause a session',
            description: 'Pause one session and read the new status back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Session id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const all = await sessionManager.list({});
                const before = all.find((s) => s.id === id);
                if (!before) return fail(`session ${id} does not exist`);
                await sessionManager.pause(id);
                const after = (await sessionManager.list({})).find((s) => s.id === id);
                if (after && after.status === 'paused') {
                    return {
                        ok: true,
                        detail: `Paused "${before.title}"`,
                        evidence: `${id}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`session ${id} did not pause (${after?.status ?? 'unknown'})`);
            },
        },
        {
            panelId: 'sessions',
            id: 'resume',
            title: 'Resume a session',
            description: 'Resume a paused session and read the new status back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Session id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const all = await sessionManager.list({});
                const before = all.find((s) => s.id === id);
                if (!before) return fail(`session ${id} does not exist`);
                await sessionManager.resume(id);
                const after = (await sessionManager.list({})).find((s) => s.id === id);
                if (after && after.status === 'active') {
                    return {
                        ok: true,
                        detail: `Resumed "${before.title}"`,
                        evidence: `${id}: ${before.status} → ${after.status}`,
                        verification: 'verified',
                    };
                }
                return fail(`session ${id} did not resume (${after?.status ?? 'unknown'})`);
            },
        },
        {
            panelId: 'sessions',
            id: 'archive',
            title: 'Archive a session',
            description: 'Archive one session and read the archived flag back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Session id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const all = await sessionManager.list({});
                const before = all.find((s) => s.id === id);
                if (!before) return fail(`session ${id} does not exist`);
                await sessionManager.archive(id);
                const after = (await sessionManager.list({})).find((s) => s.id === id);
                if (after && after.isArchived) {
                    return {
                        ok: true,
                        detail: `Archived "${before.title}"`,
                        evidence: `${id}: archived`,
                        verification: 'verified',
                    };
                }
                return fail(`session ${id} was not archived`);
            },
        },

        /* -------------------------------------------------------- debates */
        {
            panelId: 'debates',
            id: 'status',
            title: 'Debate engine',
            description: 'Whether the debate engine is running and which debate is active.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const running = debateService.isEngineActive();
                const active = debateService.getActiveDebateSession();
                if (!active) {
                    return {
                        ok: true,
                        detail: running ? 'debate engine is active' : 'no debate is running',
                        evidence: 'active: none',
                        verification: 'verified',
                    };
                }
                return {
                    ok: true,
                    detail: `Debate "${active.topic}" — ${active.status}`,
                    evidence: `id: ${active.id} | round ${active.currentRound}/${active.maxRounds} | participants ${active.participants.length}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------ workspace */
        {
            panelId: 'workspace',
            id: 'status',
            title: 'Workspace attachment',
            description: 'Whether a directory is attached and what it is called.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const attached = workspaceService.isAttached();
                const name = workspaceService.getWorkspaceName();
                const root = workspaceService.getRootDirName();
                return {
                    ok: true,
                    detail: attached ? `attached ${name ? `to "${name}"` : ''}` : 'no workspace attached',
                    evidence: `root: ${root ?? 'none'}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'workspace',
            id: 'tree',
            title: 'Workspace tree',
            description: 'The top-level entries of the attached workspace.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const tree = await workspaceService.listTree();
                if (tree.length === 0) {
                    return { ok: true, detail: 'the workspace is empty', evidence: 'entries: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${tree.length} top-level entr(y|ies)`,
                    evidence: tree
                        .slice(0, 10)
                        .map((n) => `${n.name} [${n.type}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* -------------------------------------------------------- projects */
        {
            panelId: 'projects',
            id: 'overview',
            title: 'Project knowledge overview',
            description: 'How much the assistant knows about the project: panels and articles covered.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const stats = projectKnowledgeService.stats();
                return {
                    ok: true,
                    detail: `${stats.panels} panel(s), ${stats.articles} article(s)`,
                    evidence: `with article: ${stats.withArticle} | with tests: ${stats.withTests}`,
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------ policies */
        {
            panelId: 'policies',
            id: 'list',
            title: 'Policies',
            description: 'The active latency, privacy, cost and safety policies.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const policies = policyService.getPolicies();
                if (policies.length === 0) {
                    return { ok: true, detail: 'no policies', evidence: 'policies: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${policies.length} polic(y|ies)`,
                    evidence: policies
                        .slice(0, 10)
                        .map((p) => `${p.id} ${p.type} [${p.action}] on ${p.target_nodes.length} node(s)`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'policies',
            id: 'violations',
            title: 'Policy violations',
            description: 'Violations of the policies, active and resolved.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const violations = policyService.getViolations();
                if (violations.length === 0) {
                    return { ok: true, detail: 'no violations', evidence: 'violations: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${violations.length} violation(s)`,
                    evidence: violations
                        .slice(0, 10)
                        .map((v) => `${v.nodeId}: ${v.detail} [${v.severity}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'policies',
            id: 'agent-policies',
            title: 'Agent policies',
            description: 'Per-agent policy overrides.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const agentPolicies = policyService.getAllAgentPolicies();
                const ids = Object.keys(agentPolicies);
                if (ids.length === 0) {
                    return { ok: true, detail: 'no agent policy overrides', evidence: 'agents: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${ids.length} agent polic(y|ies)`,
                    evidence: ids.slice(0, 10).map((id) => id).join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'policies',
            id: 'add',
            title: 'Add a policy',
            description: 'Create a latency, privacy, cost or safety policy and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: 'latency, privacy, cost, or safety.' },
                    action: { type: 'string', description: 'block, warn, log, throttle, or mask.' },
                    targetNodes: { type: 'array', items: { type: 'string' }, description: 'Nodes the policy applies to.' },
                },
                required: ['type', 'action'],
            },
            run: async (args) => {
                const rawType = str(args['type']);
                const rawAction = str(args['action']);
                const allowedTypes = ['latency', 'privacy', 'cost', 'safety'] as const;
                const type = allowedTypes.find((t) => t === rawType);
                if (!type) return fail(`unsupported policy type "${rawType}"`);
                const allowedActions = ['block', 'warn', 'log', 'throttle', 'mask'] as const;
                const action = allowedActions.find((a) => a === rawAction);
                if (!action) return fail(`unsupported action "${rawAction}"`);
                const rawTargets = args['targetNodes'];
                const targets = Array.isArray(rawTargets)
                    ? rawTargets.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
                    : [];
                const before = policyService.getPolicies();
                await policyService.addPolicy({ type, action, value: num(args['value'], 0), target_nodes: targets });
                const after = policyService.getPolicies();
                const created = after.find((p) => !before.some((b) => b.id === p.id));
                if (!created) return fail('the policy was not stored');
                return {
                    ok: true,
                    detail: `Added a ${created.type} policy (${created.action})`,
                    evidence: `${created.id} | applies to ${created.target_nodes.length} node(s)`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'policies',
            id: 'remove',
            title: 'Remove a policy',
            description: 'Delete a policy by id and read the list back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Policy id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = policyService.getPolicies().find((p) => p.id === id);
                if (!before) return fail(`policy ${id} does not exist`);
                await policyService.removePolicy(id);
                if (policyService.getPolicies().some((p) => p.id === id)) {
                    return fail(`policy ${id} is still there`);
                }
                return {
                    ok: true,
                    detail: `Removed the ${before.type} policy`,
                    evidence: `removed: ${id}`,
                    verification: 'verified',
                };
            },
        },

        /* ----------------------------------------------------------- roles */
        {
            panelId: 'roles',
            id: 'list',
            title: 'Roles',
            description: 'The agent roles and their capability breadth.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const roles = roleService.getAllRoles();
                if (roles.length === 0) {
                    return { ok: true, detail: 'no roles', evidence: 'roles: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${roles.length} role(s)`,
                    evidence: roles
                        .slice(0, 10)
                        .map((r) => `${r.id} ${r.name} (${r.capabilities.length} capab., ${r.permissions.length} perm.)`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'roles',
            id: 'stats',
            title: 'Role usage',
            description: 'How much each role is used and how many nodes are assigned.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const rows = roleService.getRolesWithStats();
                if (rows.length === 0) {
                    return { ok: true, detail: 'no role stats', evidence: 'roles: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${rows.length} role(s) with stats`,
                    evidence: rows
                        .slice(0, 10)
                        .map((r) => `${r.name}: ${r.usageStats.assignedNodes.length} node(s), ${r.usageStats.totalCalls} calls`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'roles',
            id: 'create',
            title: 'Create a role',
            description: 'Create a custom role and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Role name.' },
                    description: { type: 'string', description: 'Role description (optional).' },
                },
                required: ['name'],
            },
            run: async (args) => {
                const name = str(args['name']);
                if (!name) return fail('name is required');
                const role = await roleService.addRole({
                    name,
                    description: str(args['description']) || undefined,
                    capabilities: [],
                    permissions: [],
                });
                const stored = roleService.getAllRoles().find((r) => r.id === role.id);
                if (!stored) return fail('the role was not stored');
                return {
                    ok: true,
                    detail: `Created role "${stored.name}"`,
                    evidence: `id: ${stored.id}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'roles',
            id: 'remove',
            title: 'Delete a role',
            description: 'Delete a custom role and read the list back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Role id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const before = roleService.getAllRoles().find((r) => r.id === id);
                if (!before) return fail(`role ${id} does not exist`);
                await roleService.deleteRole(id);
                if (roleService.getAllRoles().some((r) => r.id === id)) {
                    return fail(`role ${id} is still there (built-in roles cannot be deleted)`);
                }
                return {
                    ok: true,
                    detail: `Removed role "${before.name}"`,
                    evidence: `removed: ${id}`,
                    verification: 'verified',
                };
            },
        },

        /* ---------------------------------------------------------- safety */
        {
            panelId: 'safety',
            id: 'patterns',
            title: 'Safety patterns',
            description: 'The PII, toxicity and blocklist patterns the policy service applies.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const patterns = policyService.getSecurityPatterns();
                if (patterns.length === 0) {
                    return { ok: true, detail: 'no safety patterns', evidence: 'patterns: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${patterns.length} pattern(s)`,
                    evidence: patterns
                        .slice(0, 10)
                        .map((p) => `${p.label} [${p.type}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------- settings */
        {
            panelId: 'settings',
            id: 'current',
            title: 'Current settings',
            description: 'The active behaviour settings of the product.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const s = settingsService.getSettings();
                return {
                    ok: true,
                    detail: `mode: ${s.defaultMode}, theme: ${s.theme}, language: ${s.language}`,
                    evidence: `streaming: ${s.streamingEnabled} | sla: ${s.slaMode} | notifications: ${s.notifications}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'settings',
            id: 'profiles',
            title: 'Settings profiles',
            description: 'Saved settings profiles.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const profiles = settingsService.getProfiles();
                if (profiles.length === 0) {
                    return { ok: true, detail: 'no settings profiles', evidence: 'profiles: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${profiles.length} profile(s)`,
                    evidence: profiles.map((p) => `${p.id} ${p.name}`).join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'settings',
            id: 'set-mode',
            title: 'Set the default mode',
            description: 'Switch the default mode and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    mode: { type: 'string', description: 'broadcast, single, or smart.' },
                },
                required: ['mode'],
            },
            run: async (args) => {
                const mode = str(args['mode']);
                const allowed = ['broadcast', 'single', 'smart'] as const;
                const normalized = allowed.find((m) => m === mode);
                if (!normalized) return fail(`unsupported mode "${mode}"`);
                const before = settingsService.getSettings().defaultMode;
                await settingsService.updateSettings({ defaultMode: normalized });
                const after = settingsService.getSettings().defaultMode;
                if (after !== normalized) return fail('mode did not change');
                return {
                    ok: true,
                    detail: `Default mode is now ${after}`,
                    evidence: `${before} → ${after}`,
                    verification: 'verified',
                };
            },
        },

        /* ----------------------------------------------------------- audit */
        {
            panelId: 'audit',
            id: 'recent',
            title: 'Audit trail',
            description: 'The recent audit entries: who did what, to what.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const entries = await needExtras().audit.list(20);
                if (entries.length === 0) {
                    return { ok: true, detail: 'no audit entries', evidence: 'entries: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${entries.length} audit entr(y|ies)`,
                    evidence: entries
                        .map((e) => `${e.actor} ${e.action}${e.target ? ` → ${e.target}` : ''}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* -------------------------------------------------------- research */
        {
            panelId: 'research',
            id: 'recent',
            title: 'Research runs',
            description: 'The latest research runs and their status.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const runs = needExtras().research.getRecentRuns(10);
                if (runs.length === 0) {
                    return { ok: true, detail: 'no research runs yet', evidence: 'runs: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${runs.length} research run(s)`,
                    evidence: runs
                        .map((r) => `${r.id} ${r.module} [${r.status}]`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* ------------------------------------------------------------ wiki */
        {
            panelId: 'wiki',
            id: 'overview',
            title: 'Wiki Brain overview',
            description: 'How many pages and sources the LLM wiki has compiled.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const stats = await needExtras().wiki.stats();
                return {
                    ok: true,
                    detail: `${stats.pages} page(s), ${stats.sources} source(s)`,
                    evidence: `compiled from raw sources`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'pages',
            title: 'Wiki pages',
            description: 'The recently compiled wiki pages.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const pages = await needExtras().wiki.recentPages(10);
                if (pages.length === 0) {
                    return { ok: true, detail: 'no wiki pages yet', evidence: 'pages: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${pages.length} page(s)`,
                    evidence: pages.map((p) => `${p.slug} ${p.title} [${p.type}]`).join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'lint-run',
            title: 'Run wiki lint',
            description: 'Check the wiki for dead links and orphan pages and report how many issues were found.',
            permission: 'tool:write',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const count = await needExtras().wiki.runLint();
                return {
                    ok: true,
                    detail: count === 0 ? 'lint clean' : `${count} lint issue(s)`,
                    evidence: `issues: ${count}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'queue',
            title: 'Wiki ingest queue',
            description: 'Sources waiting to be compiled.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const queue = await needExtras().wiki.queueSummary();
                return {
                    ok: true,
                    detail: `${queue.pending} pending of ${queue.total} task(s)`,
                    evidence: `pending: ${queue.pending}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'search',
            title: 'Search the wiki',
            description: 'Find compiled wiki pages about a topic.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'Search text.' } },
                required: ['query'],
            },
            run: async (args) => {
                const query = str(args['query']);
                if (!query) return fail('query is required');
                const hits = await needExtras().wiki.search(query);
                if (hits.length === 0) {
                    return { ok: true, detail: `nothing in the wiki matches "${query}"`, evidence: 'hits: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${hits.length} page(s)`,
                    evidence: hits.map((h) => `${h.slug} ${h.title} — ${h.snippet}`).join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'ingest-source',
            title: 'Queue a source',
            description: 'Queue markdown text as a raw source for the LLM wiki compiler.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Source title.' },
                    content: { type: 'string', description: 'The raw markdown text.' },
                },
                required: ['title', 'content'],
            },
            run: async (args) => {
                const title = str(args['title']);
                const content = str(args['content']);
                if (!title) return fail('title is required');
                if (!content) return fail('content is required');
                const { sourceId, taskId } = await needExtras().wiki.enqueueSource({ title, content });
                return {
                    ok: true,
                    detail: `Queued "${title}" for ingest`,
                    evidence: `source: ${sourceId} | task: ${taskId}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'wiki',
            id: 'add-page',
            title: 'Add a curated page',
            description: 'Write a wiki page directly, without an LLM ingest.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    slug: { type: 'string', description: 'Unique kebab-case slug.' },
                    title: { type: 'string', description: 'Page title.' },
                    body: { type: 'string', description: 'Markdown body.' },
                },
                required: ['slug', 'title', 'body'],
            },
            run: async (args) => {
                const slug = str(args['slug']);
                const title = str(args['title']);
                const body = str(args['body']);
                if (!slug) return fail('slug is required');
                if (!title) return fail('title is required');
                if (!body) return fail('body is required');
                const { slug: storedSlug } = await needExtras().wiki.putCuratedPage({ slug, title, body });
                return {
                    ok: true,
                    detail: `Added wiki page "${title}"`,
                    evidence: `slug: ${storedSlug}`,
                    verification: 'verified',
                };
            },
        },

        /* --------------------------------------------------------- trust */
        {
            panelId: 'trust',
            id: 'ledger',
            title: 'Trust ledger',
            description: 'What the assistant believes it can do, and how far it trusts each capability.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const records = capabilityTrustService.list();
                if (records.length === 0) {
                    return { ok: true, detail: 'trust ledger is empty', evidence: 'capabilities: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${records.length} capabilit(y|ies)`,
                    evidence: records
                        .slice(0, 10)
                        .map((c) => `${c.id} ${c.title} [${c.trust}]${c.stale ? ' (stale)' : ''}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'trust',
            id: 'stats',
            title: 'Trust summary',
            description: 'How many capabilities are declared, discovered or verified.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const stats = capabilityTrustService.stats();
                return {
                    ok: true,
                    detail: `${stats.total} capabilit(y|ies): ${stats.verified} verified`,
                    evidence: `declared: ${stats.declared} | discovered: ${stats.discovered} | verified: ${stats.verified} | stale: ${stats.stale}`,
                    verification: 'verified',
                };
            },
        },

        /* -------------------------------------------- providers (extras) */
        {
            panelId: 'providers',
            id: 'suggestions',
            title: 'Provider suggestions',
            description: 'Providers the assistant suggests installing, with a reason.',
            permission: 'tool:read',
            parameters: { type: 'object', properties: {} },
            run: async () => {
                const suggestions = providerTracker.getCollaborativeSuggestions();
                if (suggestions.length === 0) {
                    return { ok: true, detail: 'no provider suggestions', evidence: 'suggestions: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${suggestions.length} suggestion(s)`,
                    evidence: suggestions
                        .slice(0, 10)
                        .map((s) => `${s.provider}: ${s.reason}`)
                        .join(' | '),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'providers',
            id: 'metrics',
            title: 'Provider key metrics',
            description: 'Latency, errors and quota of one stored key for a provider.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: {
                    provider: { type: 'string', description: 'Provider slug.' },
                    keyId: { type: 'string', description: 'Key id (optional — uses the first key of the provider).' },
                },
                required: ['provider'],
            },
            run: async (args) => {
                const provider = str(args['provider']);
                if (!provider) return fail('provider is required');
                let keyId = str(args['keyId']);
                if (!keyId) {
                    const first = keyService.getKeys().find((k) => k.provider.toLowerCase() === provider.toLowerCase());
                    keyId = first?.id ?? '';
                }
                if (!keyId) return fail(`no stored key for provider "${provider}"`);
                const metrics = providerTracker.getMetrics(provider, keyId);
                if (!metrics) return fail(`no metrics for key ${keyId}`);
                return {
                    ok: true,
                    detail: `${provider} key ${keyId}`,
                    evidence: `avg latency ${metrics.avgLatency} ms | errors ${metrics.errors} | quota ${metrics.quotaRemaining}/${metrics.quotaLimit}`,
                    verification: 'verified',
                };
            },
        },

        /* -------------------------------------------- workspace (extras) */
        {
            panelId: 'workspace',
            id: 'read',
            title: 'Read a workspace file',
            description: 'Read one file from the attached workspace.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { path: { type: 'string', description: 'File path.' } },
                required: ['path'],
            },
            run: async (args) => {
                const path = str(args['path']);
                if (!path) return fail('path is required');
                const content = await workspaceService.readFile(path);
                return {
                    ok: true,
                    detail: `Read ${path}`,
                    evidence: snippet(content),
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'workspace',
            id: 'search',
            title: 'Search the workspace',
            description: 'Find files in the workspace by name pattern.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { pattern: { type: 'string', description: 'Glob or path fragment.' } },
                required: ['pattern'],
            },
            run: async (args) => {
                const pattern = str(args['pattern']);
                if (!pattern) return fail('pattern is required');
                const matches = await workspaceService.search(pattern);
                if (matches.length === 0) {
                    return { ok: true, detail: 'no matches', evidence: 'matches: 0', verification: 'verified' };
                }
                return {
                    ok: true,
                    detail: `${matches.length} match(es)`,
                    evidence: matches.slice(0, 10).join(' | '),
                    verification: 'verified',
                };
            },
        },

        /* --------------------------------------------- agents (extras) */
        {
            panelId: 'agents',
            id: 'detail',
            title: 'One agent in detail',
            description: 'The resolved identity of one agent: role, model and provider.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { id: { type: 'string', description: 'Agent id.' } },
                required: ['id'],
            },
            run: async (args) => {
                const id = str(args['id']);
                if (!id) return fail('id is required');
                const agent = agentService.resolveAgent(id);
                if (!agent) return fail(`agent ${id} does not exist`);
                return {
                    ok: true,
                    detail: `${agent.name} (${agent.role})`,
                    evidence: `model: ${agent.model || 'auto'} | provider: ${agent.provider || 'auto'}`,
                    verification: 'verified',
                };
            },
        },

        /* ---------------------------------------------------- permissions */
        {
            panelId: 'permissions',
            id: 'state',
            title: 'Agent permission state',
            description: 'The permission mode, preset, rules and denial count of one agent.',
            permission: 'tool:read',
            parameters: {
                type: 'object',
                properties: { agentId: { type: 'string', description: 'Agent id.' } },
                required: ['agentId'],
            },
            run: async (args) => {
                const id = str(args['agentId']);
                if (!id) return fail('agentId is required');
                const state = agentPermissionService.getState(id);
                return {
                    ok: true,
                    detail: `mode: ${state.mode}, preset: ${state.preset}`,
                    evidence: `rules: ${state.rules.length} | denials: ${state.consecutiveDenials}`,
                    verification: 'verified',
                };
            },
        },
        {
            panelId: 'permissions',
            id: 'set-mode',
            title: 'Set the permission mode',
            description: 'Switch one agent between read-only, guarded, workspace and full, and read it back.',
            permission: 'tool:write',
            parameters: {
                type: 'object',
                properties: {
                    agentId: { type: 'string', description: 'Agent id.' },
                    mode: { type: 'string', description: 'read-only, guarded, workspace, or full.' },
                },
                required: ['agentId', 'mode'],
            },
            run: async (args) => {
                const id = str(args['agentId']);
                if (!id) return fail('agentId is required');
                const mode = str(args['mode']);
                const allowed = ['read-only', 'guarded', 'workspace', 'full'] as const;
                const normalized = allowed.find((m) => m === mode);
                if (!normalized) return fail(`unsupported mode "${mode}"`);
                const before = agentPermissionService.getState(id).mode;
                await agentPermissionService.setMode(id, normalized);
                const after = agentPermissionService.getState(id).mode;
                if (after !== normalized) return fail('mode did not change');
                return {
                    ok: true,
                    detail: `Mode for ${id} is now ${after}`,
                    evidence: `${before} → ${after}`,
                    verification: 'verified',
                };
            },
        },
    ];
}

/**
 * Register every panel descriptor once. Safe to call from every mount of the
 * assistant: existing descriptors are skipped, not re-registered (the catalog
 * is strict about duplicates).
 */
export function ensurePanelActionCatalog(catalog: PanelActionCatalog): number {
    let added = 0;
    for (const descriptor of panelActionDescriptors()) {
        if (catalog.get(descriptor.panelId, descriptor.id)) continue;
        catalog.register(descriptor);
        added += 1;
    }
    return added;
}
