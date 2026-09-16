/**
 * Rival-parity domain types — Roadmap Phase F (10 projects, §RIVALS_COMPARE.md).
 *
 * GroupChat (AutoGen), guardrails (Swarm), memory blocks (Letta), SOPs
 * (MetaGPT), autonomy loops (AutoGPT/BabyAGI), run queue + toolkits
 * (SuperAGI), planners + filters (Semantic Kernel), dyads (CAMEL).
 *
 * Persistence: Dexie v33 (`agentLoops`, `groupChats`, `memoryBlocks`,
 * `runQueue`, `threads`). Communication: EventBus (`loop:*`, `groupchat:*`,
 * `guardrail:*`, `block:*`, `sop:*`, `queue:*`, `plan:*`, `dyad:*`).
 */

export type SpeakerSelection = 'auto' | 'round_robin' | 'manual';

export interface ChatTurn {
    speaker: string;
    text: string;
    round: number;
    createdAt: number;
}

export interface GroupChat {
    id: string;
    name: string;
    members: string[];
    selection: SpeakerSelection;
    maxRounds: number;
    stopPhrases: string[];
    turns: ChatTurn[];
    status: 'running' | 'completed' | 'aborted';
    createdAt: number;
    updatedAt: number;
}

export interface GuardrailRule {
    id: string;
    name: string;
    /** 'contains' | 'regex' | 'minLength' | 'maxLength' */
    kind: 'contains' | 'regex' | 'minLength' | 'maxLength';
    pattern?: string;
    value?: number;
    /** 'block' stops the run, 'flag' records and continues. */
    tripwire: 'block' | 'flag';
    createdAt: number;
}

export interface MemoryBlock {
    id: string;
    ownerId: string;
    section: 'human' | 'persona' | 'system';
    content: string;
    charLimit: number;
    updatedAt: number;
    createdAt: number;
}

export interface SopPhase {
    name: string;
    role: string;
    artifact: string;
    instruction: string;
}

export interface SopDefinition {
    id: string;
    name: string;
    phases: SopPhase[];
    createdAt: number;
}

export type AgentLoopKind = 'autonomy' | 'task_queue' | 'sop' | 'dyad';

export interface AgentLoop {
    id: string;
    kind: AgentLoopKind;
    goal: string;
    status: 'running' | 'completed' | 'stuck' | 'failed' | 'aborted';
    iterations: number;
    maxIterations: number;
    taskList: Array<{ id: string; text: string; status: 'pending' | 'doing' | 'done' }>;
    log: string[];
    result?: string;
    createdAt: number;
    updatedAt: number;
}

export type QueuedRunKind = 'crew' | 'graph' | 'eval';

export interface QueuedRun {
    id: string;
    kind: QueuedRunKind;
    refId: string;
    input?: Record<string, unknown>;
    status: 'queued' | 'running' | 'done' | 'failed';
    result?: string;
    createdAt: number;
    updatedAt: number;
}

export interface Toolkit {
    id: string;
    name: string;
    /** Tool name prefixes included in this pack, e.g. ['workspace.', 'http.']. */
    prefixes: string[];
    createdAt: number;
}
