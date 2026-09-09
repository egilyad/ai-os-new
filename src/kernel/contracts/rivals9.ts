import type { ILifecycle } from './lifecycle';

/** N.2 — OpenClaw: SOUL/AGENTS/HEARTBEAT import + channels + cron + ClawHub. */
export interface IOpenClawService extends ILifecycle {
    importSoul(markdown: string): Promise<string>;
    importAgentsRoster(markdown: string): Promise<{ agents: number; handoffs: number }>;
    importHeartbeat(markdown: string): Promise<string[]>;
    registerChannel(name: string, kind: string): Promise<void>;
    listChannels(): Promise<Array<{ name: string; kind: string }>>;
    dueCron(now?: number): Promise<Array<{ id: string; agent: string; message: string }>>;
    publishClawSkill(input: { name: string; description: string; permissions?: string[] }): Promise<string>;
}

/** N.2 — DeepSeek-Harness: plugins, presets, trajectory, cache discipline. */
export interface IDshService extends ILifecycle {
    registerPlugin(name: string, capabilities?: string[]): Promise<void>;
    setPluginEnabled(name: string, enabled: boolean): Promise<void>;
    listPlugins(): Promise<Array<{ name: string; enabled: boolean; capabilities: string[] }>>;
    presetTools(preset: 'standard' | 'code' | 'minimal' | 'creative'): Promise<string[]>;
    appendTrajectory(runId: string, event: string, data?: Record<string, unknown>): Promise<void>;
    trajectory(runId: string): Promise<Array<{ event: string; at: number }>>;
    /** Prefix-cache discipline: stable context first, volatile last. */
    orderForCache(stable: string[], volatile: string[]): string[];
    spawnSubagent(goal: string): Promise<string>;
    healthCheck(): Promise<{ plugins: number; keys: boolean; queue: number }>;
}

/** N.3 — Manus: executor→verifier, schedules, replay export. */
export interface IManusService extends ILifecycle {
    runVerified(input: { kind: 'crew' | 'graph'; refId: string; rubric?: string; maxFixes?: number }): Promise<{
        status: string;
        rounds: number;
        report: string;
    }>;
    schedule(name: string, cron: string, task: string): Promise<string>;
    dueRuns(now?: number): Promise<Array<{ id: string; name: string; task: string }>>;
    exportRun(kind: 'crew' | 'graph' | 'council', refId: string): Promise<string>;
}

/** N.3 — Genspark Super Agent: multi-model fanout, sheets, long tasks. */
export interface IGensparkService extends ILifecycle {
    fanout(prompt: string, providers?: string[]): Promise<{ answers: string[]; synthesis: string }>;
    sheets(rows: Array<Record<string, unknown>>): Promise<string>;
    longTask(kind: 'crew' | 'graph', refId: string, notifyTitle?: string): Promise<string>;
}
