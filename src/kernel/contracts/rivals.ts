import type { ILifecycle } from './lifecycle';
import type {
    AgentLoop,
    ChatTurn,
    GroupChat,
    GuardrailRule,
    MemoryBlock,
    QueuedRun,
    SopDefinition,
    SpeakerSelection,
    Toolkit,
} from '../types/rival-types';

export type {
    AgentLoop,
    ChatTurn,
    GroupChat,
    GuardrailRule,
    MemoryBlock,
    QueuedRun,
    SopDefinition,
    SpeakerSelection,
    Toolkit,
} from '../types/rival-types';

/** F.2 — AutoGen-style group chat with speaker selection + nested chats. */
export interface IGroupChatService extends ILifecycle {
    createChat(input: {
        name: string;
        members: string[];
        selection?: SpeakerSelection;
        maxRounds?: number;
        stopPhrases?: string[];
    }): Promise<GroupChat>;
    postTurn(chatId: string, speaker: string, text: string): Promise<GroupChat>;
    /** Next speaker runs a turn through the LLM boundary (or echo offline). */
    nextTurn(chatId: string, speaker?: string): Promise<ChatTurn>;
    summarize(chatId: string): Promise<string>;
    /** Nested chat: run a sub-chat, inject its summary as a turn here. */
    nestChat(chatId: string, topic: string): Promise<GroupChat>;
    listChats(): Promise<GroupChat[]>;
    get(chatId: string): Promise<GroupChat | null>;
}

/** F.2 — Swarm-style tripwire guardrails. */
export interface IGuardrailService extends ILifecycle {
    addRule(input: {
        name: string;
        kind: GuardrailRule['kind'];
        pattern?: string;
        value?: number;
        tripwire?: 'block' | 'flag';
    }): Promise<GuardrailRule>;
    listRules(): Promise<GuardrailRule[]>;
    removeRule(id: string): Promise<void>;
    /** Returns { ok, hits } — block-hits stop the caller, flags only record. */
    check(text: string): Promise<{ ok: boolean; hits: string[] }>;
}

/** F.2 — Letta-style editable core blocks + agent-callable memory tools. */
export interface IMemoryBlocksService extends ILifecycle {
    setBlock(ownerId: string, section: MemoryBlock['section'], content: string, charLimit?: number): Promise<MemoryBlock>;
    appendBlock(ownerId: string, section: MemoryBlock['section'], text: string): Promise<MemoryBlock>;
    getBlocks(ownerId: string): Promise<MemoryBlock[]>;
    corePrompt(ownerId: string): Promise<string>;
}

/** F.3 — MetaGPT-style SOPs, autonomy loops, run queue, planners, dyads. */
export interface ISopService extends ILifecycle {
    defineSop(name: string, phases: Array<{ name: string; role: string; artifact: string; instruction: string }>): Promise<SopDefinition>;
    listSops(): Promise<SopDefinition[]>;
    runSop(sopId: string, goal: string): Promise<AgentLoop>;
}

export interface IAutonomyService extends ILifecycle {
    /** AutoGPT loop: plan → act → critique until done/stuck/maxIters. */
    runGoal(goal: string, maxIterations?: number): Promise<AgentLoop>;
    /** BabyAGI loop: create → prioritize → execute task list. */
    runTaskQueue(objective: string, maxIterations?: number): Promise<AgentLoop>;
    listLoops(): Promise<AgentLoop[]>;
    getLoop(id: string): Promise<AgentLoop | null>;
    abortLoop(id: string): Promise<void>;
}

export interface IRunQueueService extends ILifecycle {
    enqueue(kind: QueuedRun['kind'], refId: string, input?: Record<string, unknown>): Promise<QueuedRun>;
    /** Process the queue with a concurrency cap (sequential default). */
    drain(concurrency?: number): Promise<QueuedRun[]>;
    list(): Promise<QueuedRun[]>;
    defineToolkit(name: string, prefixes: string[]): Promise<Toolkit>;
    listToolkits(): Promise<Toolkit[]>;
    toolkitAllows(toolkitId: string, tool: string): Promise<boolean>;
}

export type PlannerStrategy = 'sequential' | 'function_calling' | 'stepwise' | 'plan_and_execute';

export interface IPlannerService extends ILifecycle {
    plan(task: string, strategy?: PlannerStrategy): Promise<string>;
    planStep(step: string): Promise<string>;
    /** Composable pre/post middleware: audit → policy → trim. */
    addFilter(stage: 'pre' | 'post', name: string): Promise<void>;
    listFilters(): Promise<Array<{ stage: string; name: string }>>;
}

export interface IDyadService extends ILifecycle {
    /** CAMEL dyad: AI-user ↔ AI-assistant with inception prompts. */
    startDyad(input: {
        topic: string;
        userRole?: string;
        assistantRole?: string;
        maxTurns?: number;
        stopPhrases?: string[];
    }): Promise<AgentLoop>;
    listLoops(): Promise<AgentLoop[]>;
    getLoop(id: string): Promise<AgentLoop | null>;
}
