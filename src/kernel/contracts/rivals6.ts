import type { ILifecycle } from './lifecycle';

/** K.1 — n8n-style workflows with safe transform recipes. */
export interface IN8nService extends ILifecycle {
    defineWorkflow(input: {
        name: string;
        nodes: Array<{
            id: string;
            type: 'trigger' | 'action' | 'transform' | 'router';
            tool?: string;
            recipe?: { op: 'map' | 'filter' | 'reduce' | 'get'; field?: string; equals?: string };
            routes?: Array<{ when: string; to: string }>;
        }>;
        edges: Array<{ from: string; to: string }>;
        entryId: string;
    }): Promise<string>;
    run(workflowId: string, input?: Record<string, unknown>): Promise<Record<string, unknown>>;
    executions(workflowId?: string): Promise<Array<{ id: string; workflowId: string; status: string }>>;
}

/** K.1 — Make-style modules with filters, iterators, aggregators, error routes. */
export interface IMakeService extends ILifecycle {
    runScenario(input: {
        modules: Array<{
            id: string;
            tool?: string;
            args?: Record<string, unknown>;
            filter?: string;
            iterator?: string;
            aggregate?: 'array' | 'concat' | 'sum';
            onError?: string;
        }>;
        initial?: Record<string, unknown>;
    }): Promise<Record<string, unknown>>;
}

/** K.1 — Zapier-style zaps with paths and delays. */
export interface IZapierService extends ILifecycle {
    createZap(input: {
        name: string;
        trigger: string;
        actions: Array<{ tool?: string; args?: Record<string, unknown>; path?: string; delayMs?: number }>;
    }): Promise<string>;
    fire(zapId: string, payload?: Record<string, unknown>): Promise<string[]>;
    testZap(zapId: string): Promise<string>;
}

/** K.2 — Temporal-style durable runs with signals and retries. */
export interface ITemporalService extends ILifecycle {
    startRun(input: {
        name: string;
        steps: Array<{ name: string; tool?: string; args?: Record<string, unknown>; retries?: number }>;
        version?: number;
    }): Promise<string>;
    signal(runId: string, key: string, value: unknown): Promise<void>;
    queryState(runId: string): Promise<Record<string, unknown>>;
    resume(runId: string): Promise<string>;
}

/** K.2 — Dagster-style data assets with lineage. */
export interface IAssetService extends ILifecycle {
    defineAsset(name: string, deps?: string[], tool?: string): Promise<void>;
    materialize(name: string): Promise<string>;
    lineage(name: string): Promise<{ nodes: string[]; edges: Array<[string, string]> }>;
    freshness(name: string): Promise<number | null>;
}

/** K.2 — Airflow-style sensors. */
export interface ISensorService extends ILifecycle {
    poke(input: {
        tool: string;
        args?: Record<string, unknown>;
        expect?: string;
        intervalMs?: number;
        timeoutMs?: number;
    }): Promise<{ ok: boolean; attempts: number; last: string }>;
}

/** K.3 — Vapi-style voice calls with tool turns. */
export interface IVoiceAgentService extends ILifecycle {
    startCall(to: string, script?: string): Promise<string>;
    turn(callId: string, userAudio: string): Promise<string>;
    endCall(callId: string): Promise<string>;
    transcript(callId: string): Promise<string[]>;
}

/** K.3 — Intercom-style support inbox. */
export interface ISupportService extends ILifecycle {
    openTicket(subject: string, message: string): Promise<string>;
    reply(ticketId: string, text: string, by?: string): Promise<void>;
    defineMacro(name: string, text: string): Promise<void>;
    applyMacro(ticketId: string, macro: string): Promise<void>;
    botDraft(ticketId: string): Promise<string>;
    handoff(ticketId: string, team?: string): Promise<void>;
    resolutionRate(): Promise<number>;
}

/** K.3 — Notion/Guru-style verification queue + gaps. */
export interface IVerifyService extends ILifecycle {
    submitAnswer(question: string, answer: string, source?: string): Promise<string>;
    verify(id: string, ok: boolean): Promise<void>;
    logGap(question: string): Promise<void>;
    verifiedAnswer(question: string): Promise<string | null>;
    gaps(): Promise<string[]>;
}

/** K.3 — Gamma-style outline → slides → markdown. */
export interface IDeckService extends ILifecycle {
    buildDeck(topic: string, slides?: number): Promise<{
        title: string;
        slides: Array<{ title: string; bullets: string[]; notes?: string }>;
    }>;
    exportMarkdown(deck: { title: string; slides: Array<{ title: string; bullets: string[]; notes?: string }> }): string;
}
