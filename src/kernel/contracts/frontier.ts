import type { ILifecycle } from './lifecycle';
import type {
    Benchmark,
    BenchmarkCase,
    CapabilityMatrixEntry,
    EvalRun,
    IntentPlan,
    ModalCapability,
    OrgCharter,
    RedFinding,
    SimAgent,
    Simulation,
    SocietyNorm,
} from '../types/frontier-types';

export type {
    Benchmark,
    BenchmarkCase,
    CapabilityMatrixEntry,
    EvalRun,
    IntentPlan,
    ModalCapability,
    OrgCharter,
    RedFinding,
    SimAgent,
    Simulation,
    SocietyNorm,
} from '../types/frontier-types';

/** Executor boundary — evals run deterministically offline without it. */
export interface IFrontierExecutor {
    execute(task: string): Promise<string>;
}

/** Wave 12: benchmarks, A/B comparison, red-team, capability matrix. */
export interface IEvalService extends ILifecycle {
    createBenchmark(input: {
        name: string;
        description?: string;
        cases: Array<{
            task: string;
            expectContains?: string;
            maxScore?: number;
            metric?: Benchmark['cases'][number]['metric'];
            reference?: string;
        }>;
    }): Promise<Benchmark>;
    listBenchmarks(): Promise<Benchmark[]>;
    runBenchmark(benchmarkId: string, subject?: string): Promise<EvalRun>;
    listRuns(benchmarkId?: string): Promise<EvalRun[]>;
    /** A/B: same benchmark through two executors, winner + delta. */
    compare(benchmarkId: string, subjectA?: string, subjectB?: string): Promise<{
        runA: EvalRun;
        runB: EvalRun;
        winner: 'A' | 'B' | 'draw';
        delta: number;
    }>;
    redTeam(target: string, attacks: string[]): Promise<RedFinding[]>;
    listFindings(): Promise<RedFinding[]>;
    capabilityMatrix(): Promise<CapabilityMatrixEntry[]>;
}

/** Wave 13 (selective): simulations + cross-model society norms. */
export interface ISimulationService extends ILifecycle {
    createSimulation(input: {
        name: string;
        kind?: Simulation['kind'];
        agents: Array<{ name: string; traits?: Record<string, number>; state?: string }>;
        rounds?: number;
    }): Promise<Simulation>;
    step(id: string): Promise<Simulation>;
    get(id: string): Promise<Simulation | null>;
    addNorm(societyId: string, rule: string): Promise<SocietyNorm>;
    recordAdherence(normId: string, followed: boolean): Promise<SocietyNorm>;
    listNorms(societyId: string): Promise<SocietyNorm[]>;
}

/** Wave 13 (selective): long-horizon orgs + intent interface + multimodal registry. */
export interface IFrontierOpsService extends ILifecycle {
    charterOrg(name: string, mission: string, members?: string[]): Promise<OrgCharter>;
    heartbeat(orgId: string, note: string): Promise<OrgCharter>;
    dissolveOrg(orgId: string): Promise<OrgCharter>;
    listOrgs(): Promise<OrgCharter[]>;
    planIntent(intent: string): Promise<IntentPlan>;
    registerModal(input: {
        modality: ModalCapability['modality'];
        agentId: string;
        note?: string;
    }): Promise<ModalCapability>;
    listModals(): Promise<ModalCapability[]>;
}
