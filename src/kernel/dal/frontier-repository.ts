/**
 * FrontierRepository — DAL for Phase D (Dexie v31, 8 tables).
 *
 *   - benchmarks: 'id, name, createdAt'
 *   - evalRuns: 'id, benchmarkId, createdAt'
 *   - redFindings: 'id, target, createdAt'
 *   - simulations: 'id, kind, createdAt'
 *   - societyNorms: 'id, societyId, createdAt'
 *   - orgs: 'id, status, createdAt'
 *   - intents: 'id, createdAt'
 *   - modalCaps: 'id, modality, agentId, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    Benchmark,
    EvalRun,
    IntentPlan,
    ModalCapability,
    OrgCharter,
    RedFinding,
    Simulation,
    SocietyNorm,
} from '../types/frontier-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class FrontierRepository {
    constructor(private db: DatabaseService) {}

    // ── Benchmarks ──
    async putBenchmark(b: Benchmark): Promise<void> {
        await this.db.benchmarks.put(clone(b));
    }

    async getBenchmark(id: string): Promise<Benchmark | null> {
        const r = await this.db.benchmarks.get(id);
        return r ? clone(r) : null;
    }

    async listBenchmarks(): Promise<Benchmark[]> {
        const rows = await this.db.benchmarks.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Eval runs ──
    async putRun(r: EvalRun): Promise<void> {
        await this.db.evalRuns.put(clone(r));
    }

    async listRuns(): Promise<EvalRun[]> {
        const rows = await this.db.evalRuns.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Red findings ──
    async putFinding(f: RedFinding): Promise<void> {
        await this.db.redFindings.put(clone(f));
    }

    async listFindings(): Promise<RedFinding[]> {
        const rows = await this.db.redFindings.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Simulations ──
    async putSimulation(s: Simulation): Promise<void> {
        await this.db.simulations.put(clone(s));
    }

    async getSimulation(id: string): Promise<Simulation | null> {
        const r = await this.db.simulations.get(id);
        return r ? clone(r) : null;
    }

    // ── Norms ──
    async putNorm(n: SocietyNorm): Promise<void> {
        await this.db.societyNorms.put(clone(n));
    }

    async getNorm(id: string): Promise<SocietyNorm | null> {
        const r = await this.db.societyNorms.get(id);
        return r ? clone(r) : null;
    }

    async listNorms(): Promise<SocietyNorm[]> {
        return (await this.db.societyNorms.toArray()).map(clone);
    }

    // ── Orgs ──
    async putOrg(o: OrgCharter): Promise<void> {
        await this.db.orgs.put(clone(o));
    }

    async getOrg(id: string): Promise<OrgCharter | null> {
        const r = await this.db.orgs.get(id);
        return r ? clone(r) : null;
    }

    async listOrgs(): Promise<OrgCharter[]> {
        const rows = await this.db.orgs.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Intents ──
    async putIntent(p: IntentPlan): Promise<void> {
        await this.db.intents.put(clone(p));
    }

    // ── Modal caps ──
    async putModal(m: ModalCapability): Promise<void> {
        await this.db.modalCaps.put(clone(m));
    }

    async listModals(): Promise<ModalCapability[]> {
        return (await this.db.modalCaps.toArray()).map(clone);
    }

    async clear(): Promise<void> {
        await this.db.modalCaps.clear();
        await this.db.intents.clear();
        await this.db.orgs.clear();
        await this.db.societyNorms.clear();
        await this.db.simulations.clear();
        await this.db.redFindings.clear();
        await this.db.evalRuns.clear();
        await this.db.benchmarks.clear();
    }
}
