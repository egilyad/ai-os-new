import type { ILifecycle } from './lifecycle';
import type {
    CharacterDoc,
    Connection,
    IntegrationApp,
    LoadedDoc,
    ModeDef,
    ReactRun,
    ReactStep,
    ScopedMem,
} from '../types/rival2-types';

export type {
    CharacterDoc,
    Connection,
    IntegrationApp,
    LoadedDoc,
    ModeDef,
    ReactRun,
    ReactStep,
    ScopedMem,
} from '../types/rival2-types';

/** G.1 — LangChain-style explicit ReAct loop with scratchpad. */
export interface IReactService extends ILifecycle {
    run(task: string, maxSteps?: number): Promise<ReactRun>;
}

/** G.1 — document loaders + recursive splitter + text→doc converter. */
export interface ILoaderService extends ILifecycle {
    loadText(title: string, content: string): Promise<LoadedDoc>;
    loadUrl(title: string, url: string): Promise<LoadedDoc>;
    loadWorkspace(path: string): Promise<LoadedDoc>;
    split(text: string, chunkSize?: number, overlap?: number): string[];
    toDoc(text: string): { title: string; chunks: string[] };
    /** Agno-style proposition chunking (LLM sentences → atomic claims). */
    agenticChunk(text: string): Promise<string[]>;
}

/** G.1 — LlamaIndex-style agentic RAG loop. */
export interface IRagService extends ILifecycle {
    answer(query: string, refineRounds?: number): Promise<{
        answer: string;
        citations: string[];
        rounds: number;
    }>;
}

/** G.2 — OpenHands-style sandboxed runtime action stream. */
export interface IRuntimeService extends ILifecycle {
    startRun(goal: string, ticketId?: string): Promise<string>;
    act(runId: string, action: string, args?: Record<string, unknown>): Promise<string>;
    observe(runId: string, observation: string): Promise<void>;
    finishRun(runId: string, result: string): Promise<string>;
}

/** G.2 — SWE-agent-style ACI over the workspace. */
export interface ISweService extends ILifecycle {
    find(pattern: string): Promise<string[]>;
    open(path: string, from?: number, to?: number): Promise<string>;
    edit(path: string, oldText: string, newText: string): Promise<string>;
    createFile(path: string, content: string): Promise<string>;
    requestTests(ref: string): Promise<string>;
    buildPatch(): Promise<string>;
}

/** G.2 — Aider-style repo-map + edits + commit messages. */
export interface IAiderService extends ILifecycle {
    repoMap(maxFiles?: number): Promise<string>;
    applyEdit(path: string, format: 'whole' | 'diff', payload: string): Promise<string>;
    commitMessage(diff: string): Promise<string>;
    testChecklist(change: string): Promise<string[]>;
}

/** G.2 — Roo-style modes (built-in + custom) with toolkit gating. */
export interface IModesService extends ILifecycle {
    listModes(): Promise<ModeDef[]>;
    defineMode(name: string, systemPrompt: string, toolkitId?: string): Promise<ModeDef>;
    switchMode(modeId: string): Promise<ModeDef>;
    currentMode(): Promise<ModeDef | null>;
    modeAllows(modeId: string, tool: string): Promise<boolean>;
}

/** G.3 — Mem0-style scoped memory with version history. */
export interface IScopedMemService extends ILifecycle {
    add(scope: string, ownerId: string, content: string): Promise<ScopedMem>;
    search(scope: string, ownerId: string, query: string, limit?: number): Promise<ScopedMem[]>;
    get(id: string): Promise<ScopedMem | null>;
    update(id: string, content: string): Promise<ScopedMem>;
    delete(id: string): Promise<void>;
    history(id: string): Promise<Array<{ content: string; at: number }>>;
}

/** G.3 — Composio-style integration catalog + connections + triggers. */
export interface IIntegrationsService extends ILifecycle {
    catalog(): Promise<IntegrationApp[]>;
    connect(app: string, label: string, authRef?: string): Promise<Connection>;
    listConnections(): Promise<Connection[]>;
    disconnect(id: string): Promise<void>;
    fireTrigger(app: string, trigger: string, payload?: Record<string, unknown>): Promise<string>;
}

/** G.3 — Eliza-style character import + client registry. */
export interface ICharacterService extends ILifecycle {
    importCharacter(doc: CharacterDoc): Promise<string>;
    registerClient(name: string, kind: string): Promise<string>;
    listClients(): Promise<Array<{ name: string; kind: string }>>;
    routeFromClient(client: string, text: string): Promise<string>;
}
