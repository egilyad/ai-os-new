import type { ILifecycle } from './lifecycle';

export interface Reasoning {
    goal: string;
    steps: string[];
    risks: string[];
}

/** H.1 — Agno-style explicit reasoning block. */
export interface IReasoningService extends ILifecycle {
    think(task: string): Promise<Reasoning>;
}

/** H.1 — Google ADK-style sessions + parallel/loop runners. */
export interface ISessionStateService extends ILifecycle {
    setState(scope: 'app' | 'user' | 'session', scopeId: string, key: string, value: unknown): Promise<void>;
    getState(scope: 'app' | 'user' | 'session', scopeId: string): Promise<Record<string, unknown>>;
    runParallel(prompts: string[]): Promise<string[]>;
    runLoop(body: string, maxIterations?: number, stopPhrase?: string): Promise<string>;
}

/** H.1 — Dify-style datasets with annotations + retrieval config. */
export interface IDatasetService extends ILifecycle {
    createDataset(name: string, sourceIds?: string[]): Promise<string>;
    addAnnotation(datasetId: string, question: string, answer: string): Promise<void>;
    query(datasetId: string, question: string, topK?: number): Promise<{
        answer: string;
        sources: string[];
        fromAnnotation: boolean;
    }>;
    listDatasets(): Promise<Array<{ id: string; name: string; sources: number }>>;
}

/** H.1 — Langflow-style flows-as-API tokens. */
export interface IFlowApiService extends ILifecycle {
    publishToken(graphId: string, label?: string): Promise<string>;
    invoke(token: string, input?: Record<string, unknown>): Promise<string>;
    listTokens(): Promise<Array<{ token: string; graphId: string; label?: string }>>;
    revoke(token: string): Promise<void>;
}

/** H.2 — Flowise-style document stores + message feedback. */
export interface IDocStoreService extends ILifecycle {
    createStore(name: string, sourceIds?: string[]): Promise<string>;
    bindChat(storeId: string, chatId: string): Promise<void>;
    ask(storeId: string, query: string): Promise<string>;
    feedback(messageId: string, vote: 'up' | 'down'): Promise<void>;
}

/** H.2 — PydanticAI-style typed agents (deps + zod-validated output). */
export interface ITypedAgentService extends ILifecycle {
    defineAgent(input: {
        name: string;
        system: string;
        outputSchema: Record<string, unknown>;
        maxRetries?: number;
    }): Promise<string>;
    runAgent(agentId: string, task: string, deps?: Record<string, unknown>): Promise<unknown>;
}

/** H.2 — TaskWeaver-style code-first plans over the tool pool. */
export interface ICodePlanService extends ILifecycle {
    planAndRun(task: string, maxRounds?: number): Promise<{
        calls: Array<{ plugin: string; args: Record<string, unknown>; result: string }>;
        answer: string;
    }>;
}

/** H.3 — Rasa-style intents/slots/stories bots. */
export interface IDialogueService extends ILifecycle {
    createBot(input: {
        name: string;
        intents: Array<{ name: string; examples: string[] }>;
        slots?: Array<{ name: string; question: string }>;
    }): Promise<string>;
    handleMessage(botId: string, sessionId: string, text: string): Promise<string>;
}

/** H.3 — Botpress-style autonomous routing + node analytics. */
export interface IBotRouterService extends ILifecycle {
    route(candidates: string[], context: string): Promise<string>;
    recordNode(nodeId: string): Promise<void>;
    analytics(): Promise<Array<{ nodeId: string; hits: number }>>;
    kbAnswer(query: string): Promise<string>;
}

/** H.3 — Voiceflow-style CMS slots + funnels + share export. */
export interface IPrototypeService extends ILifecycle {
    setSlot(key: string, value: string): Promise<void>;
    getSlot(key: string): Promise<string | null>;
    funnelStep(funnel: string, step: string): Promise<void>;
    funnelStats(funnel: string): Promise<Record<string, number>>;
    exportTranscript(title: string, lines: string[]): Promise<string>;
}
