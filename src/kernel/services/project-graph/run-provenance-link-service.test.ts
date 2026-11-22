import { describe, expect, it, vi } from 'vitest';
import { RunProvenanceLinkService } from './run-provenance-link-service';
import type { RunHistoryRecord } from '../../contracts/run-history';

function record(): RunHistoryRecord {
    return {
        runId: 'run-1',
        goal: 'goal',
        status: 'completed',
        startedAt: 1,
        finishedAt: 4,
        steps: [
            { nodeId: 'research', input: {}, output: { research: 'r' }, timestamp: 1 },
            { nodeId: 'draft', input: { research: 'r' }, output: { draft: 'd' }, timestamp: 2 },
            { nodeId: 'verify', input: { draft: 'd' }, output: { error: 'timeout' }, timestamp: 3 },
        ],
        artifacts: [
            {
                nodeId: 'research',
                type: 'report',
                content: 'r',
                createdAt: 1,
                provenance: 'computed',
            },
            {
                nodeId: 'draft',
                type: 'report',
                content: 'd',
                createdAt: 2,
                provenance: 'hypothesis',
            },
            { nodeId: 'verify', type: 'review', content: 'v', createdAt: 3, provenance: 'parsed' },
        ],
    };
}

function fakeDeps(getResult: RunHistoryRecord | null = record()) {
    const nodes: Array<Record<string, unknown>> = [];
    const edges: Array<Record<string, unknown>> = [];
    return {
        nodes,
        edges,
        history: { get: vi.fn(async () => getResult) },
        graph: {
            upsertNode: vi.fn(async (input: Record<string, unknown>) => {
                const node = { ...input, id: `node-${nodes.length + 1}` };
                nodes.push(node);
                return node as never;
            }),
            link: vi.fn(async (input: Record<string, unknown>) => {
                edges.push(input);
                return input as never;
            }),
        },
    };
}

describe('RunProvenanceLinkService', () => {
    it('строит рёбра утверждение → источник по типу provenance', async () => {
        const deps = fakeDeps();
        const svc = new RunProvenanceLinkService(deps);
        const result = await svc.link('run-1', 'project-1');

        expect(result).toEqual({ linked: 2, failures: 1 });
        expect(deps.nodes.filter((n) => n['refType'] === 'run-artifact')).toHaveLength(3);
        expect(deps.nodes.filter((n) => n['refType'] === 'run-source')).toHaveLength(2);
        expect(deps.nodes.filter((n) => n['refType'] === 'run-failure')).toHaveLength(1);
        expect(deps.edges.map((e) => e['relation'])).toEqual(['supports', 'cites']);
        expect(deps.edges.map((e) => e['label'])).toEqual(['hypothesis', 'parsed']);
        expect(deps.nodes.find((n) => n['refType'] === 'run-failure')?.['payload']).toMatchObject({
            error: 'timeout',
        });
    });

    it('не делает ничего для неизвестного запуска', async () => {
        const deps = fakeDeps(null);
        const svc = new RunProvenanceLinkService(deps);
        await expect(svc.link('missing', 'project-1')).resolves.toEqual({
            linked: 0,
            failures: 0,
        });
        expect(deps.nodes).toHaveLength(0);
        expect(deps.edges).toHaveLength(0);
    });
});
