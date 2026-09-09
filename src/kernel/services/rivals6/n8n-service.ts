/**
 * N8nService — K.1 (n8n-style workflows, additive).
 *
 * Nodes: trigger (inject input) / action (ToolRunner tool) / transform
 * (safe recipes: map/filter/reduce/get — no eval) / router (first matching
 * `field=value` route). Execution log persists in DAL kv (`n8n-runs/*`).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IN8nService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('N8n');

type N8nNode =
    | { id: string; type: 'trigger' }
    | { id: string; type: 'action'; tool?: string }
    | {
        id: string;
        type: 'transform';
        recipe?: { op: 'map' | 'filter' | 'reduce' | 'get'; field?: string; equals?: string };
    }
    | { id: string; type: 'router'; routes?: Array<{ when: string; to: string }> };

interface WorkflowDoc {
    id: string;
    name: string;
    nodes: N8nNode[];
    edges: Array<{ from: string; to: string }>;
    entryId: string;
}

function getPath(obj: unknown, path?: string): unknown {
    if (!path) return obj;
    let cur: unknown = obj;
    for (const part of path.split('.')) {
        if (typeof cur !== 'object' || cur === null) return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
}

function applyRecipe(data: unknown, recipe: NonNullable<Extract<N8nNode, { type: 'transform' }>['recipe']>): unknown {
    const { op, field, equals } = recipe;
    if (op === 'get') return getPath(data, field);
    const arr = Array.isArray(data) ? data : [data];
    if (op === 'map') return arr.map((x) => getPath(x, field));
    if (op === 'filter') {
        return arr.filter((x) => {
            const v = getPath(x, field);
            return equals !== undefined ? String(v) === equals : Boolean(v);
        });
    }
    // reduce: numeric sum over field.
    return arr.reduce<number>((a, x) => a + (Number(getPath(x, field)) || 0), 0);
}

function matchRoute(when: string, data: Record<string, unknown>): boolean {
    const eq = when.indexOf('=');
    if (eq < 0) return Boolean(getPath(data, when.trim()));
    const key = when.slice(0, eq).trim();
    const val = when.slice(eq + 1).trim();
    return String(getPath(data, key) ?? '') === val;
}

export class N8nService implements IN8nService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineWorkflow(input: {
        name: string;
        nodes: WorkflowDoc['nodes'];
        edges: Array<{ from: string; to: string }>;
        entryId: string;
    }): Promise<string> {
        const ids = new Set(input.nodes.map((n) => n.id));
        if (!ids.has(input.entryId)) throw new Error(`Entry node not found: ${input.entryId}`);
        for (const e of input.edges) {
            if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`Edge references unknown node: ${e.from}→${e.to}`);
        }
        const doc: WorkflowDoc = {
            id: genId('n8n'),
            name: input.name.slice(0, 120),
            nodes: input.nodes,
            edges: input.edges,
            entryId: input.entryId,
        };
        await this.dal.kv.set(`n8n/${doc.id}`, doc);
        return doc.id;
    }

    async run(workflowId: string, input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        const doc = await this.dal.kv.get<WorkflowDoc>(`n8n/${workflowId}`);
        if (!doc) throw new Error(`Workflow not found: ${workflowId}`);
        const byId = new Map(doc.nodes.map((n) => [n.id, n]));
        const outgoing = new Map<string, string[]>();
        for (const e of doc.edges) {
            const list = outgoing.get(e.from) ?? [];
            list.push(e.to);
            outgoing.set(e.from, list);
        }
        let data: Record<string, unknown> = { ...input };
        const queue = [doc.entryId];
        const seen = new Set<string>();
        let guard = 100;
        while (queue.length > 0 && guard-- > 0) {
            const id = queue.shift() as string;
            if (seen.has(id)) continue;
            seen.add(id);
            const node = byId.get(id);
            if (!node) continue;
            if (node.type === 'action' && node.tool) {
                if (!this.tools) throw new Error('Tool runner unavailable');
                const out = await this.tools.callTool('n8n', node.tool, data);
                data = { ...data, [`out:${id}`]: out, lastOutput: out };
            } else if (node.type === 'transform' && node.recipe) {
                data = { ...data, [`out:${id}`]: applyRecipe(data, node.recipe), lastOutput: applyRecipe(data, node.recipe) };
            } else if (node.type === 'router' && node.routes) {
                const hit = node.routes.find((r) => matchRoute(r.when, data));
                if (hit) queue.push(hit.to);
                continue;
            }
            for (const next of outgoing.get(id) ?? []) queue.push(next);
        }
        const execId = genId('n8nexec');
        await this.dal.kv.set(`n8n-runs/${execId}`, { id: execId, workflowId, status: 'done', at: Date.now() });
        this.events.emit(EVENTS.N8N_RUN, { workflowId, execId });
        return data;
    }

    async executions(workflowId?: string): Promise<Array<{ id: string; workflowId: string; status: string }>> {
        const rows = await this.dal.kv.list('n8n-runs/');
        const all = rows.map((r) => r.value as { id: string; workflowId: string; status: string });
        const filtered = workflowId ? all.filter((e) => e.workflowId === workflowId) : all;
        return filtered.slice(-50);
    }
}
