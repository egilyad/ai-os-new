import type { ILifecycle } from './lifecycle';

/** J.1 — app-builders: clarify → scaffold → preview. */
export interface IAppBuilderService extends ILifecycle {
    clarify(spec: string): Promise<string[]>;
    scaffold(spec: string, answers?: Record<string, string>): Promise<{
        files: Array<{ path: string; content: string }>;
        preview: string;
    }>;
    writeScaffold(files: Array<{ path: string; content: string }>): Promise<string[]>;
}

/** J.1 — AI IDE: codebase Q&A + edit plans + terminal queue. */
export interface IIdeService extends ILifecycle {
    askCodebase(question: string): Promise<string>;
    editPlan(task: string): Promise<Array<{ path: string; change: string }>>;
    terminal(command: string): Promise<string>;
}

/** J.1 — LangSmith-style versioned prompt hub. */
export interface IPromptHubService extends ILifecycle {
    publish(name: string, template: string): Promise<number>;
    render(name: string, vars?: Record<string, string>, version?: number): Promise<string>;
    listPrompts(): Promise<Array<{ name: string; versions: number }>>;
}

/** J.2 — Palantir-style typed ontology + governed actions. */
export interface IOntologyService extends ILifecycle {
    defineType(name: string, fields: string[]): Promise<void>;
    linkTypes(from: string, relation: string, to: string): Promise<void>;
    createInstance(type: string, data: Record<string, unknown>): Promise<string>;
    runAction(instanceId: string, tool: string, args?: Record<string, unknown>): Promise<string>;
}

/** J.2 — Glean-style ACL-aware retrieval. */
export interface IAclService extends ILifecycle {
    tagSource(sourceId: string, roles: string[]): Promise<void>;
    searchScoped(agentId: string, query: string, limit?: number): Promise<Array<{ title: string; chunk: string }>>;
}

/** J.2 — UiPath-style work items + robots + assets. */
export interface IWorkQueueService extends ILifecycle {
    push(payload: Record<string, unknown>, maxRetries?: number): Promise<string>;
    claim(robotId: string): Promise<{ id: string; payload: Record<string, unknown> } | null>;
    complete(itemId: string, result?: string): Promise<void>;
    fail(itemId: string, error?: string): Promise<void>;
    setAsset(key: string, refName: string): Promise<void>;
    getAsset(key: string): Promise<string | null>;
}

/** J.2 — Writer-style terminology + claim guardrails. */
export interface IWriterService extends ILifecycle {
    setTerminology(mustUse: string[], banned: string[]): Promise<void>;
    check(text: string): Promise<{ score: number; issues: string[] }>;
}

/** J.3 — Operator-style computer-use action pack (ticket-gated). */
export interface IComputerService extends ILifecycle {
    act(ticketId: string, action: string, args?: Record<string, unknown>): Promise<string>;
}

/** J.3 — search provider abstraction with fallback chain. */
export interface ISearchService extends ILifecycle {
    registerProvider(name: string, keyRef?: string): Promise<void>;
    search(query: string, limit?: number): Promise<Array<{ title: string; snippet: string; via: string }>>;
}

/** J.3 — E2B-style code tickets (validate locally, execute externally). */
export interface ICodeExecService extends ILifecycle {
    submit(language: string, code: string): Promise<string>;
    setExecutor(delegate: (ticketId: string, language: string, code: string) => Promise<string>): void;
    result(ticketId: string): Promise<string>;
}
