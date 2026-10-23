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
    memoryService,
} from '../../kernel/instances/services-core';
import { agemsApprovalService } from '../../kernel/services/agems-approval-service';
import type {
    PanelActionCatalog,
    PanelActionDescriptor,
} from '../../kernel/contracts/panel-actions';
import type { AssistantActionResult } from '../../kernel/contracts/assistant';

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
                        .map((p) => `#${p.id} ${p.tool} (${p.agentId})`)
                        .join(' | '),
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
