import type { ILifecycle } from './lifecycle';

export interface IMetabolicService extends ILifecycle {
    tick(signal: string, intensity?: number): Promise<{ action: string; dominant: string }>;
    dominantFocus(): Promise<string>;
    setDominant(goal: string): Promise<void>;
}

export interface IMaestroService extends ILifecycle {
    createEcosystem(name: string, roles: string[]): Promise<string>;
    orchestrate(ecoId: string, task: string): Promise<string>;
}

export interface ILocalTripleService extends ILifecycle {
    run(task: string): Promise<{ plan: string; result: string; critique: string }>;
}

export interface IChemistService extends ILifecycle {
    ask(question: string): Promise<string>;
}

export interface IAnalitikService extends ILifecycle {
    intake(request: string): Promise<string>;
}

export interface IRuslanService extends ILifecycle {
    learn(skill: string, example: string): Promise<void>;
    use(skill: string, task: string): Promise<string>;
}

export interface IHeisenbergService extends ILifecycle {
    board(): Promise<Array<{ id: string; title: string; status: string }>>;
    seedBoard(): Promise<Array<{ id: string; title: string; status: string }>>;
    move(cardId: string, status: 'todo'|'doing'|'done'): Promise<void>;
}

export interface IAgencyRuService extends ILifecycle {
    catalog(): Promise<string[]>;
    importAgent(name: string): Promise<string>;
}

export interface IEvoLabService extends ILifecycle {
    runLab(pattern: string): Promise<{ metric: string; score: number }>;
}

export interface IGigaStudioService extends ILifecycle {
    generate(spec: string): Promise<{ files: string[]; preview: string }>;
}
