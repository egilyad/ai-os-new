import type { ILifecycle } from './lifecycle';

/** Q.1 — NetLogo-style grid turtles + BehaviorSpace. */
export interface INetLogoService extends ILifecycle {
    createWorld(size?: number, breeds?: string[]): Promise<string>;
    seedTurtles(worldId: string, breed: string, count: number): Promise<void>;
    tick(worldId: string, steps?: number): Promise<{ ticks: number; populations: Record<string, number> }>;
    snapshot(worldId: string): Promise<string>;
    behaviorSpace(worldId: string, paramSets: Array<Record<string, number>>): Promise<Array<{ params: Record<string, number>; result: Record<string, number> }>>;
}

/** Q.1 — Mesa-style schedulers + DataCollector + batch runs. */
export interface IMesaService extends ILifecycle {
    createModel(scheduler?: 'random' | 'simultaneous' | 'staged'): Promise<string>;
    addAgents(modelId: string, count: number, energy?: number): Promise<void>;
    step(modelId: string, steps?: number): Promise<Record<string, number[]>>;
    batchRun(paramSets: Array<{ agents: number; steps: number }>): Promise<Array<{ params: Record<string, number>; mean: number }>>;
}

/** Q.1 — Bonsai-style curriculum + Q-brain + assessment. */
export interface IBonsaiService extends ILifecycle {
    registerSim(name: string, states: string[], actions: string[]): Promise<void>;
    defineLesson(sim: string, fromState: string, goalState: string): Promise<string>;
    train(lessonId: string, episodes?: number): Promise<{ policy: Record<string, string>; reward: number }>;
    assess(lessonId: string): Promise<{ score: number; steps: number }>;
}

/** Q.2 — Chainlit-style step tree + elements. */
export interface IChainlitService extends ILifecycle {
    startRun(title: string): Promise<string>;
    startStep(runId: string, name: string, parentId?: string): Promise<string>;
    endStep(stepId: string, output?: string): Promise<void>;
    attach(runId: string, kind: 'text' | 'file' | 'image', ref: string): Promise<void>;
    feedback(runId: string, vote: 'up' | 'down'): Promise<void>;
    tree(runId: string): Promise<string>;
}

/** Q.2 — Gradio-style interfaces + flagging. */
export interface IGradioService extends ILifecycle {
    defineInterface(input: { name: string; inputs: string[]; tool?: string; crewId?: string }): Promise<string>;
    predict(interfaceId: string, values: Record<string, string>): Promise<string>;
    flag(interfaceId: string, values: Record<string, string>, note?: string): Promise<void>;
}

/** Q.2 — Observable-style chart specs + SVG. */
export interface IChartService extends ILifecycle {
    spec(kind: 'line' | 'bar' | 'pie' | 'scatter', series: Array<{ label: string; values: number[] }>): Record<string, unknown>;
    svg(kind: 'line' | 'bar', series: Array<{ label: string; values: number[] }>): string;
    fromMeter(metric: string, kind?: 'line' | 'bar'): Promise<Record<string, unknown>>;
}

/** Q.2 — Gephi-style layouts + SVG export. */
export interface IGraphVizService extends ILifecycle {
    layout(nodes: string[], edges: Array<[string, string]>, mode?: 'layered' | 'force'): Record<string, { x: number; y: number }>;
    svg(nodes: string[], edges: Array<[string, string]>, mode?: 'layered' | 'force'): string;
}

/** Q.3 — Malmo-style grid missions. */
export interface IMalmoService extends ILifecycle {
    createMission(input: { name: string; map: string[]; goals?: string[] }): Promise<string>;
    act(missionId: string, agent: string, move: string): Promise<{ reward: number; done: boolean }>;
    renderMap(missionId: string): Promise<string>;
    scoreboard(missionId: string): Promise<Record<string, number>>;
}

/** Q.3 — Gymnasium-style env API. */
export interface IGymService extends ILifecycle {
    make(env: string): Promise<string>;
    reset(instanceId: string, seed?: number): Promise<string>;
    step(instanceId: string, action: string): Promise<{ obs: string; reward: number; done: boolean }>;
}
