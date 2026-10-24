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
    agentService,
    keyService,
    memoryOrchestrator,
    memoryService,
    providerTracker,
    systemStatusService,
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
