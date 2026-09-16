/**
 * Rival-parity-2 domain types — Roadmap Phase G (§RIVALS2_COMPARE.md).
 *
 * ReAct scratchpads (LangChain), loaders (LangChain), RAG answers (LlamaIndex),
 * runtime actions (OpenHands), ACI patches (SWE-agent), repo edits (Aider),
 * modes (Roo), scoped memories (Mem0), integrations (Composio), characters (Eliza).
 *
 * Persistence: Dexie v34 (`scopedMem` only; rest reuses kv + agentLoops).
 * Communication: EventBus (`react:*`, `rag:*`, `runtime:*`, `swe:*`,
 * `aider:*`, `modes:*`, `smem:*`, `integration:*`, `character:*`, `loader:*`).
 */

export interface ReactStep {
    thought: string;
    action?: string;
    args?: Record<string, unknown>;
    observation?: string;
}

export interface ReactRun {
    id: string;
    task: string;
    steps: ReactStep[];
    answer: string;
    status: 'completed' | 'stuck' | 'failed';
    createdAt: number;
}

export interface LoadedDoc {
    id: string;
    title: string;
    uri?: string;
    chunks: string[];
    createdAt: number;
}

export interface ScopedMem {
    id: string;
    scope: string;
    ownerId: string;
    content: string;
    versions: Array<{ content: string; at: number }>;
    createdAt: number;
    updatedAt: number;
}

export interface ModeDef {
    id: string;
    name: string;
    systemPrompt: string;
    toolkitId?: string;
    custom: boolean;
    createdAt: number;
}

export interface IntegrationApp {
    name: string;
    auth: 'oauth' | 'api_key' | 'none';
    actions: string[];
    triggers: string[];
}

export interface Connection {
    id: string;
    app: string;
    label: string;
    /** Auth reference NAME only — never secrets. */
    authRef?: string;
    createdAt: number;
}

export interface CharacterDoc {
    name: string;
    bio?: string[];
    lore?: string[];
    style?: { chat?: string[]; post?: string[] };
    topics?: string[];
    adjectives?: string[];
}
