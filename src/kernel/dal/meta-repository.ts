/**
 * MetaRepository — DAL for Phase B (Dexie v29, 8 tables).
 *
 *   - improvements: 'id, kind, status, createdAt'
 *   - strategies: 'id, taskClass, createdAt'
 *   - decompositions: 'id, createdAt'
 *   - healthSignals: 'id, kind, createdAt'
 *   - cogMemories: 'id, ownerId, kind, scope, createdAt'
 *   - memPolicies: 'id, scope, createdAt'
 *   - counterfactuals: 'id, ownerId, createdAt'
 *   - knowledgePackages: 'id, taskClass, createdAt'
 */
import type { DatabaseService } from '../services/database-service';
import type {
    CogMemory,
    CounterfactualRecord,
    Decomposition,
    HealthSignal,
    ImprovementProposal,
    KnowledgePackage,
    MemoryPolicy,
    StrategyRecord,
} from '../types/meta-types';

function clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
}

export class MetaRepository {
    constructor(private db: DatabaseService) {}

    // ── Improvements ──
    async putProposal(p: ImprovementProposal): Promise<void> {
        await this.db.improvements.put(clone(p));
    }

    async getProposal(id: string): Promise<ImprovementProposal | null> {
        const r = await this.db.improvements.get(id);
        return r ? clone(r) : null;
    }

    async listProposals(): Promise<ImprovementProposal[]> {
        const rows = await this.db.improvements.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Strategies ──
    async putStrategy(s: StrategyRecord): Promise<void> {
        await this.db.strategies.put(clone(s));
    }

    async listStrategies(): Promise<StrategyRecord[]> {
        return (await this.db.strategies.toArray()).map(clone);
    }

    // ── Decompositions ──
    async putDecomposition(d: Decomposition): Promise<void> {
        await this.db.decompositions.put(clone(d));
    }

    async getDecomposition(id: string): Promise<Decomposition | null> {
        const r = await this.db.decompositions.get(id);
        return r ? clone(r) : null;
    }

    // ── Health ──
    async putHealth(h: HealthSignal): Promise<void> {
        await this.db.healthSignals.put(clone(h));
    }

    async listHealth(): Promise<HealthSignal[]> {
        const rows = await this.db.healthSignals.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Cog memories ──
    async putCogMemory(m: CogMemory): Promise<void> {
        await this.db.cogMemories.put(clone(m));
    }

    async getCogMemory(id: string): Promise<CogMemory | null> {
        const r = await this.db.cogMemories.get(id);
        return r ? clone(r) : null;
    }

    async listCogMemories(): Promise<CogMemory[]> {
        return (await this.db.cogMemories.toArray()).map(clone);
    }

    async deleteCogMemory(id: string): Promise<void> {
        await this.db.cogMemories.delete(id);
    }

    // ── Policies ──
    async putPolicy(p: MemoryPolicy): Promise<void> {
        await this.db.memPolicies.put(clone(p));
    }

    async listPolicies(): Promise<MemoryPolicy[]> {
        return (await this.db.memPolicies.toArray()).map(clone);
    }

    // ── Counterfactuals ──
    async putCounterfactual(c: CounterfactualRecord): Promise<void> {
        await this.db.counterfactuals.put(clone(c));
    }

    async listCounterfactuals(): Promise<CounterfactualRecord[]> {
        const rows = await this.db.counterfactuals.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    // ── Packages ──
    async putPackage(p: KnowledgePackage): Promise<void> {
        await this.db.knowledgePackages.put(clone(p));
    }

    async listPackages(): Promise<KnowledgePackage[]> {
        const rows = await this.db.knowledgePackages.toArray();
        rows.sort((a, b) => b.createdAt - a.createdAt);
        return rows.map(clone);
    }

    async clear(): Promise<void> {
        await this.db.knowledgePackages.clear();
        await this.db.counterfactuals.clear();
        await this.db.memPolicies.clear();
        await this.db.cogMemories.clear();
        await this.db.healthSignals.clear();
        await this.db.decompositions.clear();
        await this.db.strategies.clear();
        await this.db.improvements.clear();
    }
}
