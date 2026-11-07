import { describe, it, expect, vi } from 'vitest';
import { executeBuilderManifest } from './builder-bridge';
import type { WorkflowManifest } from '../../types/builder-types';

function makeGraphs() {
    return {
        defineGraph: vi.fn(async () => ({ id: 'graph-1' })),
        runGraph: vi.fn(async () => ({ id: 'run-1', status: 'completed' })),
    };
}

function makeManifest(): WorkflowManifest {
    return {
        title: 'My Flow',
        description: 'desc',
        workflow_id: 'wf-1',
        nodes: [
            { id: 'n1', type: 'agent', label: 'A' },
            { id: 'n2', type: 'synthesis', label: 'S' },
        ],
        edges: [{ id: 'e1', from: 'n1', to: 'n2', trigger: 'when', condition: undefined }],
    } as WorkflowManifest;
}

describe('executeBuilderManifest', () => {
    it('compiles the manifest into a graph and runs it', async () => {
        const graphs = makeGraphs();
        const result = await executeBuilderManifest(graphs as never, makeManifest(), { q: 1 });
        expect(result).toEqual({ graphId: 'graph-1', runId: 'run-1', status: 'completed' });
        const [defInput] = graphs.defineGraph.mock.calls[0] as [Record<string, unknown>];
        expect((defInput.name as string)).toContain('My Flow');
        const nodes = defInput.nodes as Array<{ kind: string }>;
        expect(nodes[0]!.kind).toBe('task');
        expect(nodes[1]!.kind).toBe('reflection');
        expect(graphs.runGraph).toHaveBeenCalledWith(
            'graph-1',
            expect.objectContaining({ builderFlowId: 'wf-1', q: 1 }),
        );
    });

    it('defaults unknown node kinds to task', async () => {
        const graphs = makeGraphs();
        const manifest = makeManifest();
        manifest.nodes = [{ id: 'x', type: 'custom', label: 'X' }];
        await executeBuilderManifest(graphs as never, manifest);
        const nodes = graphs.defineGraph.mock.calls[0]![0].nodes as Array<{ kind: string }>;
        expect(nodes[0]!.kind).toBe('task');
    });
});
