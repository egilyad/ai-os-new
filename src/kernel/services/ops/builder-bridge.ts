/**
 * Builder bridge — Wave 5 (draw-your-agents idea, additive).
 *
 * Turns a visual Builder `WorkflowManifest` (or any node/edge lists) into an
 * executable State Graph via IGraphService, then runs it. Builder service is
 * untouched — this is a one-way compile step: visual graph → runtime graph.
 */
import type { WorkflowManifest } from '../../types/builder-types';
import type { IGraphService } from '../../contracts/graph';
import type { GraphNodeKind } from '../../types/graph-types';

const KIND_MAP: Record<string, GraphNodeKind> = {
    agent: 'task',
    debate: 'council',
    junction: 'task',
    forum: 'task',
    synthesis: 'reflection',
    interpretation: 'task',
    gate: 'gate',
};

export async function executeBuilderManifest(
    graphs: IGraphService,
    manifest: WorkflowManifest,
    input: Record<string, unknown> = {},
): Promise<{ graphId: string; runId: string; status: string }> {
    const def = await graphs.defineGraph({
        name: `Builder: ${manifest.title}`.slice(0, 160),
        description: manifest.description,
        mode: 'graph',
        nodes: manifest.nodes.map((n) => ({
            id: n.id,
            kind: KIND_MAP[n.type] ?? 'task',
            label: n.label,
            config: { ...(n.config ?? {}), topic: manifest.title },
        })),
        edges: manifest.edges.map((e) => ({
            id: e.id,
            from: e.from,
            to: e.to,
            condition: e.condition,
            label: e.trigger,
        })),
        entryNodeId: manifest.nodes[0]?.id ?? 'entry',
    });
    const run = await graphs.runGraph(def.id, { ...input, builderFlowId: manifest.workflow_id });
    return { graphId: def.id, runId: run.id, status: run.status };
}
