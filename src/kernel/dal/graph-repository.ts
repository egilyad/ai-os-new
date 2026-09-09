/**
 * GraphRepository — DAL for State Graph runtime (Wave 3).
 *
 * Dexie v25:
 *   - graphs: 'id, mode, createdAt'
 *   - graphRuns: 'id, graphId, status, createdAt'
 *   - graphCheckpoints: 'id, runId, stepIndex, createdAt'
 *   - graphDecisions: 'id, runId, nodeId, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    DecisionEntry,
    GraphCheckpoint,
    GraphDefinition,
    GraphRecord,
    GraphRun,
    GraphRunRecord,
    GraphThread,
} from '../types/graph-types';

export class GraphRepository {
    constructor(private db: DatabaseService) {}

    // ── Definitions ──
    async putGraph(def: GraphDefinition): Promise<void> {
        const rec: GraphRecord = { ...def };
        await this.db.graphs.put(rec);
    }

    async getGraph(id: string): Promise<GraphDefinition | null> {
        const r = await this.db.graphs.get(id);
        return r ? { ...r } : null;
    }

    async listGraphs(): Promise<GraphDefinition[]> {
        const rows = await this.db.graphs.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    async deleteGraph(id: string): Promise<void> {
        await this.db.graphs.delete(id);
    }

    // ── Runs ──
    async putRun(run: GraphRun): Promise<void> {
        const rec: GraphRunRecord = { ...run };
        await this.db.graphRuns.put(rec);
    }

    async getRun(id: string): Promise<GraphRun | null> {
        const r = await this.db.graphRuns.get(id);
        return r ? { ...r } : null;
    }

    async listRuns(graphId?: string): Promise<GraphRun[]> {
        const rows = graphId
            ? await this.db.graphRuns.where('graphId').equals(graphId).toArray()
            : await this.db.graphRuns.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    // ── Checkpoints ──
    async putCheckpoint(cp: GraphCheckpoint): Promise<void> {
        await this.db.graphCheckpoints.put({ ...cp });
    }

    async listCheckpoints(runId: string): Promise<GraphCheckpoint[]> {
        const rows = await this.db.graphCheckpoints.where('runId').equals(runId).toArray();
        rows.sort((a, b) => a.stepIndex - b.stepIndex);
        return rows.map((r) => ({ ...r }));
    }

    async getCheckpoint(id: string): Promise<GraphCheckpoint | null> {
        const r = await this.db.graphCheckpoints.get(id);
        return r ? { ...r } : null;
    }

    // ── Decisions ──
    async putDecision(d: DecisionEntry): Promise<void> {
        await this.db.graphDecisions.put({ ...d });
    }

    async listDecisions(runId: string): Promise<DecisionEntry[]> {
        const rows = await this.db.graphDecisions.where('runId').equals(runId).toArray();
        rows.sort((a, b) => a.createdAt - b.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    async clearRun(runId: string): Promise<void> {        const [cps, ds] = await Promise.all([
            this.db.graphCheckpoints.where('runId').equals(runId).toArray(),
            this.db.graphDecisions.where('runId').equals(runId).toArray(),
        ]);
        await Promise.all([
            ...cps.map((c) => this.db.graphCheckpoints.delete(c.id)),
            ...ds.map((d) => this.db.graphDecisions.delete(d.id)),
        ]);
        await this.db.graphRuns.delete(runId);
    }

    // ── Threads (F.1, LangGraph thread_id analogue) ──
    async putThread(t: GraphThread): Promise<void> {
        await this.db.threads.put({ ...t });
    }

    async getThread(id: string): Promise<GraphThread | null> {
        const r = await this.db.threads.get(id);
        return r ? { ...r } : null;
    }

    async listThreads(graphId?: string): Promise<GraphThread[]> {
        const rows = graphId
            ? await this.db.threads.where('graphId').equals(graphId).toArray()
            : await this.db.threads.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map((r) => ({ ...r }));
    }

    async clear(): Promise<void> {
        await this.db.threads.clear();
        await this.db.graphDecisions.clear();
        await this.db.graphCheckpoints.clear();
        await this.db.graphRuns.clear();
        await this.db.graphs.clear();
    }
}
