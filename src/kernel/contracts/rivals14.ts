import type { ILifecycle } from './lifecycle';

export interface IClaudeCodeService extends ILifecycle {
    proposePlan(task: string): Promise<string>;
    approvePlan(planId: string): Promise<void>;
    executePlan(planId: string): Promise<string>;
    addHook(event: string, command: string): Promise<void>;
    loadPlugin(name: string): Promise<void>;
    slashCommand(cmd: string, args?: string): Promise<string>;
    spawnSubagent(task: string): Promise<string>;
}

export interface IMcpDeepService extends ILifecycle {
    discover(serverId: string): Promise<{ tools: string[]; resources: string[] }>;
    connectAll(): Promise<number>;
}

export interface IComputerExtService extends ILifecycle {
    openApp(name: string): Promise<string>;
    browserNavigate(url: string): Promise<string>;
}

export interface IFilesApiService extends ILifecycle {
    upload(name: string, content: string): Promise<string>;
    get(fileId: string): Promise<string>;
    list(): Promise<string[]>;
}

export interface ICacheControlService extends ILifecycle {
    markCacheable(key: string, ttlMs?: number): Promise<void>;
    stats(): Promise<{ entries: number; hitRate: number }>;
}

export interface IProjectService extends ILifecycle {
    createProject(name: string, instructions?: string): Promise<string>;
    addFile(projectId: string, name: string, content: string): Promise<void>;
    renderArtifact(projectId: string, prompt: string): Promise<string>;
}

export interface IDynamicWorkflowService extends ILifecycle {
    run(tasks: string[], checker?: string): Promise<string[]>;
}

export interface IRoutineService extends ILifecycle {
    define(name: string, trigger: { kind: 'schedule'|'api'|'event'; spec: string }, workflow: string[]): Promise<string>;
    trigger(routineId: string, payload?: string): Promise<string>;
}

export interface IAgentViewService extends ILifecycle {
    sessions(): Promise<Array<{ id: string; title: string }>>;
    skillViaContainer(skill: string, task: string): Promise<string>;
}
