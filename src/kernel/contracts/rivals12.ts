import type { ILifecycle } from './lifecycle';

/** R.1 — Constitutional critique + revision */
export interface IConstitutionalService extends ILifecycle {
    setConstitution(rules: string[]): Promise<void>;
    critique(text: string): Promise<{ violations: string[]; ok: boolean }>;
    revise(text: string): Promise<string>;
}

/** R.1 — Voyager skill library + curriculum */
export interface IVoyagerService extends ILifecycle {
    addSkill(name: string, code: string): Promise<void>;
    proposeGoal(context?: string): Promise<string>;
    verify(goal: string, evidence: string): Promise<boolean>;
    step(): Promise<{ goal: string; ok: boolean }>;
}

/** R.1 — Smallville memory stream + reflection */
export interface ISmallvilleService extends ILifecycle {
    observe(agentId: string, text: string, importance?: number): Promise<void>;
    reflect(agentId: string): Promise<string[]>;
    planDay(agentId: string, date: string): Promise<string[]>;
    stream(agentId: string): Promise<Array<{ text: string; importance: number }>>;
}

/** R.2 — AlphaCode sampling + test filter */
export interface IAlphaCodeService extends ILifecycle {
    generate(task: string, samples?: number): Promise<{ candidates: string[]; best: string }>;
}

/** R.2 — World Model predict + imagine */
export interface IWorldModelService extends ILifecycle {
    record(state: string, action: string, next: string, reward: number): Promise<void>;
    predict(state: string, action: string): Promise<{ next: string; reward: number } | null>;
    imagine(start: string, actions: string[]): Promise<Array<{ state: string; reward: number }>>;
}

/** R.2 — Neurosymbolic predicates + axioms */
export interface INeuroSymbolicService extends ILifecycle {
    setPredicate(name: string, score: Record<string, number>): Promise<void>;
    addAxiom(rule: string): Promise<void>;
    query(predicate: string, entity: string): Promise<number>;
}

/** R.3 — Swarm ACO/PSO */
export interface ISwarmService extends ILifecycle {
    aco(nodes: string[], edges: Array<[string,string,number]>): Promise<string[]>;
    pso(objective: string, dims?: number): Promise<{ best: number[]; score: number }>;
}

/** R.3 — ALife genomes */
export interface IALifeService extends ILifecycle {
    seed(genome: string): Promise<string>;
    tick(steps?: number): Promise<Array<{ id: string; genome: string; fitness: number }>>;
}

/** R.3 — Curiosity intrinsic bonus + Quantum annealing */
export interface ICuriosityService extends ILifecycle {
    bonus(state: string, action: string): Promise<number>;
    pickAction(state: string, actions: string[]): Promise<string>;
}
export interface IQuantumDeepService extends ILifecycle {
    defineQubo(vars: string[], couplings: Array<[string,string,number]>): Promise<string>;
    anneal(quboId: string, samples?: number): Promise<{ best: Record<string,0|1>; energy: number }>;
}
