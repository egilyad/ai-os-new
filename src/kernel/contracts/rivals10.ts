import type { ILifecycle } from './lifecycle';

export type A2ATaskState =
    | 'submitted' | 'working' | 'input-required' | 'completed' | 'canceled' | 'failed' | 'rejected';

export interface A2APart {
    kind: 'text' | 'data' | 'file';
    text?: string;
    data?: Record<string, unknown>;
    uri?: string;
    mimeType?: string;
}

/** P.1 — A2A spec: cards, tasks, parts, artifacts, SSE, push. */
export interface IA2aSpecService extends ILifecycle {
    buildCard(input: {
        name: string;
        description?: string;
        capabilities?: string[];
        streaming?: boolean;
        skills?: Array<{ id: string; name: string; description?: string }>;
    }): Promise<string>;
    getCard(agentId: string): Promise<Record<string, unknown> | null>;
    submitTask(agentId: string, parts: A2APart[]): Promise<string>;
    taskState(taskId: string): Promise<A2ATaskState>;
    addArtifact(taskId: string, parts: A2APart[]): Promise<void>;
    streamFrames(taskId: string): Promise<Array<{ event: string; data: unknown }>>;
    setPush(taskId: string, url: string): Promise<void>;
}

/** P.1 — Gemini-style context cache registry. */
export interface ICacheRegistryService extends ILifecycle {
    create(key: string, content: string, ttlMs?: number): Promise<string>;
    get(key: string): Promise<string | null>;
    sweep(): Promise<number>;
    stats(): Promise<{ entries: number; bytes: number }>;
}

/** P.1 — Genkit-style typed prompts. */
export interface IDotpromptService extends ILifecycle {
    define(input: {
        name: string;
        template: string;
        inputSchema?: Record<string, string>;
        outputSchema?: Record<string, string>;
    }): Promise<void>;
    render(name: string, vars?: Record<string, string>): Promise<string>;
    validateOutput(name: string, output: unknown): Promise<{ ok: boolean; issues: string[] }>;
}

/** P.1 — NotebookLM-style notebooks. */
export interface INotebookService extends ILifecycle {
    createNotebook(title: string, sourceIds?: string[]): Promise<string>;
    audioScript(notebookId: string): Promise<string>;
    mindmap(notebookId: string): Promise<string>;
    askNotebook(notebookId: string, question: string): Promise<string>;
}

/** P.2 — Live barge-in + tool bridge. */
export interface ILiveBridgeService extends ILifecycle {
    bargeIn(sessionId: string, note?: string): Promise<string>;
    resume(sessionId: string): Promise<string>;
    liveTool(sessionId: string, tool: string, args?: Record<string, unknown>): Promise<string>;
}

/** P.2 — CCAI-style operator assist. */
export interface IAssistService extends ILifecycle {
    smartReplies(context: string): Promise<string[]>;
    nextActions(context: string, candidates?: string[]): Promise<string[]>;
    surfaceKnowledge(context: string): Promise<string>;
}

/** P.2 — Vertex-style search app with boost/bury. */
export interface IVertexSearchService extends ILifecycle {
    bindDatastore(appId: string, datasetId: string): Promise<void>;
    boost(appId: string, terms: string[]): Promise<void>;
    bury(appId: string, terms: string[]): Promise<void>;
    answer(appId: string, query: string): Promise<string>;
}

/** P.2 — Deep Research plan + brief. */
export interface IDeepResearchService extends ILifecycle {
    plan(topic: string): Promise<string[]>;
    run(topic: string): Promise<{ brief: string; sources: string[] }>;
}

/** P.3 — per-key quota guard. */
export interface IQuotaGuardService extends ILifecycle {
    recordUse(keyId: string, tokens: number): Promise<void>;
    setQuota(keyId: string, maxTokens: number): Promise<void>;
    check(keyId: string): Promise<{ ok: boolean; used: number; quota?: number }>;
}

/** P.3 — Chat-Studio one-click packs. */
export interface IStudioPackService extends ILifecycle {
    importAgentPack(input: { name: string; prompt: string; tools?: string[] }): Promise<string>;
    quickAddMcp(name: string, url: string): Promise<string>;
    attachKb(name: string, content: string): Promise<string>;
    translate(text: string, targetLang: string, glossary?: Record<string, string>): Promise<string>;
}
