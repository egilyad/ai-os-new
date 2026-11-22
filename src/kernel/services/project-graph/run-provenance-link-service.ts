import type { IRunHistoryService } from '../../contracts/run-history';
import type { ProjectGraphRelation } from '../../types/project-types';
import type { ProjectGraphService } from './project-graph-service';

const RELATION_BY_PROVENANCE: Record<string, ProjectGraphRelation> = {
    computed: 'derived_from',
    parsed: 'cites',
    digitized: 'evidence_for',
    hypothesis: 'supports',
};

interface RunProvenanceDeps {
    history: Pick<IRunHistoryService, 'get'>;
    graph: Pick<ProjectGraphService, 'upsertNode' | 'link'>;
}

export interface ProvenanceLinkResult {
    linked: number;
    failures: number;
}

export class RunProvenanceLinkService {
    constructor(private deps: RunProvenanceDeps) {}

    async link(runId: string, projectId: string): Promise<ProvenanceLinkResult> {
        const record = await this.deps.history.get(runId);
        if (!record) return { linked: 0, failures: 0 };
        let linked = 0;
        let failures = 0;
        for (const artifact of record.artifacts) {
            const source = record.steps.find((s) => s.nodeId === artifact.nodeId);
            const provenance = artifact.provenance ?? 'computed';
            const node = await this.deps.graph.upsertNode({
                projectId,
                kind: 'artifact',
                label: `run:${runId}/${artifact.nodeId}`,
                refType: 'run-artifact',
                refId: `${runId}:${artifact.nodeId}`,
                payload: {
                    provenance,
                    type: artifact.type,
                    content: artifact.content.slice(0, 500),
                },
            });
            for (const sourceId of Object.keys(source?.input ?? {})) {
                const sourceNode = await this.deps.graph.upsertNode({
                    projectId,
                    kind: 'knowledge',
                    label: `source:${runId}/${sourceId}`,
                    refType: 'run-source',
                    refId: `${runId}:${sourceId}`,
                });
                await this.deps.graph.link({
                    projectId,
                    from: node.id,
                    to: sourceNode.id,
                    relation: RELATION_BY_PROVENANCE[provenance] ?? 'derived_from',
                    label: provenance,
                });
                linked++;
            }
        }
        for (const step of record.steps) {
            const error = step.output['error'];
            if (typeof error !== 'string' || error.length === 0) continue;
            await this.deps.graph.upsertNode({
                projectId,
                kind: 'note',
                label: `failure:${runId}/${step.nodeId}`,
                refType: 'run-failure',
                refId: `${runId}:${step.nodeId}`,
                payload: { error: error.slice(0, 500) },
            });
            failures++;
        }
        return { linked, failures };
    }
}
