import type { ILifecycle } from './lifecycle';
import type {
    CogMemory,
    CogMemoryKind,
    CounterfactualRecord,
    Decomposition,
    HealthKind,
    HealthSignal,
    ImprovementKind,
    ImprovementProposal,
    KnowledgePackage,
    MemoryPolicy,
    MemoryScope,
    StrategyRecord,
} from '../types/meta-types';

export type {
    CogMemory,
    CogMemoryKind,
    CounterfactualRecord,
    Decomposition,
    HealthKind,
    HealthSignal,
    ImprovementKind,
    ImprovementProposal,
    KnowledgePackage,
    MemoryPolicy,
    MemoryScope,
    StrategyRecord,
} from '../types/meta-types';

/** MetaAgent: improvement loop + evolution + self-diagnosis (Wave 8.12/8.13/8.15). */
export interface IMetaAgentService extends ILifecycle {
    analyze(input: {
        subject: string;
        observations: string[];
        kind?: ImprovementKind;
    }): Promise<ImprovementProposal>;
    listProposals(status?: ImprovementProposal['status']): Promise<ImprovementProposal[]>;
    accept(id: string): Promise<ImprovementProposal>;
    apply(id: string): Promise<ImprovementProposal>;
    reject(id: string): Promise<ImprovementProposal>;
    /** Distill a successful behavior into a skill manifest (via SkillMarket delegate). */
    evolveSkill(input: { name: string; pattern: string; permissions?: string[] }): Promise<string>;
    /** Health agents: record + list degradation/loop/cost/quality signals. */
    reportHealth(kind: HealthKind, source: string, message: string, severity?: number): Promise<HealthSignal>;
    listHealth(kind?: HealthKind): Promise<HealthSignal[]>;
}

/** Strategies + recursive decomposition (Wave 8.14/8.16). */
export interface IStrategyService extends ILifecycle {
    recordStrategy(taskClass: string, steps: string[], success: boolean): Promise<StrategyRecord>;
    bestFor(taskClass: string): Promise<StrategyRecord | null>;
    replay(taskClass: string): Promise<string[]>;
    decompose(goal: string, depth?: number, breadth?: number): Promise<Decomposition>;
    markNode(decompositionId: string, nodeId: string, status: 'done' | 'failed'): Promise<Decomposition>;
}

/** Unified cognitive memory + governance + counterfactuals + packages (Wave 9). */
export interface ICogMemoryService extends ILifecycle {
    write(input: {
        kind: CogMemoryKind;
        scope?: MemoryScope;
        ownerId: string;
        teamId?: string;
        content: string;
        importance?: number;
    }): Promise<CogMemory>;
    read(ownerId: string, query: string, kind?: CogMemoryKind, limit?: number): Promise<CogMemory[]>;
    setPolicy(input: {
        scope: MemoryScope;
        maxAgeMs?: number;
        maxEntries?: number;
        minImportance?: number;
        compressAfterMs?: number;
    }): Promise<MemoryPolicy>;
    /** Apply governance: drop expired/unimportant/over-quota entries. Returns removed count. */
    govern(scope?: MemoryScope): Promise<number>;
    recordCounterfactual(input: {
        ownerId: string;
        whatHappened: string;
        whatIf: string;
        lesson: string;
    }): Promise<CounterfactualRecord>;
    listCounterfactuals(ownerId: string): Promise<CounterfactualRecord[]>;
    compilePackage(input: { name: string; taskClass: string }): Promise<KnowledgePackage>;
    listPackages(): Promise<KnowledgePackage[]>;
}
