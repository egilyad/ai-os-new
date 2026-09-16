import type { ILifecycle } from './lifecycle';
import type {
    ContextEntry,
    ContextEntryKind,
    Goal,
    GoalStatus,
    LongTermMemory,
    MemoryLink,
    MemoryRelation,
    MemoryTier,
    PersonProfile,
    PersonaDepth,
    SharedContext,
    VoiceProfile,
} from '../types/persona-types';

export type {
    ContextEntry,
    ContextEntryKind,
    Goal,
    GoalStatus,
    LongTermMemory,
    MemoryLink,
    MemoryRelation,
    MemoryTier,
    PersonProfile,
    PersonaDepth,
    SharedContext,
    VoiceProfile,
} from '../types/persona-types';

/** LLM boundary — deterministic heuristics work fully offline without it. */
export interface IPersonaLlmPort {
    distillStyle(samples: string[]): Promise<{ styleNotes: string[]; judgments: string[] }>;
    summarizeMemories(memories: LongTermMemory[]): Promise<string>;
}

/**
 * Long-term memory: simple API + core/recall/archival tiers + graph links.
 * Additive over Memory Mesh (which is never touched).
 */
export interface ILtMemoryService extends ILifecycle {
    remember(input: {
        ownerId: string;
        content: string;
        tier?: MemoryTier;
        tags?: string[];
        importance?: number;
    }): Promise<LongTermMemory>;
    recall(ownerId: string, query: string, limit?: number): Promise<LongTermMemory[]>;
    coreContext(ownerId: string): Promise<string>;
    promote(id: string): Promise<LongTermMemory>;
    demote(id: string): Promise<LongTermMemory>;
    forget(id: string): Promise<void>;
    link(fromId: string, toId: string, relation: MemoryRelation): Promise<MemoryLink>;
    neighbors(id: string, depth?: number): Promise<LongTermMemory[]>;
    summarize(ownerId: string): Promise<string>;
}

/** Person / Voice distillation + deep persona model. */
export interface IPersonaService extends ILifecycle {
    distillPerson(input: {
        ownerId: string;
        displayName: string;
        samples: string[];
    }): Promise<PersonProfile>;
    getPerson(ownerId: string): Promise<PersonProfile | null>;
    distillVoice(personId: string, samples: string[], tone?: string): Promise<VoiceProfile>;
    getVoice(personId: string): Promise<VoiceProfile | null>;
    setDepth(input: {
        ownerId: string;
        traits?: Record<string, number>;
        beliefs?: string[];
        values?: string[];
        commStyle?: string;
        quirks?: string[];
    }): Promise<PersonaDepth>;
    getDepth(ownerId: string): Promise<PersonaDepth | null>;
    /** Render persona as a prompt block for an agent (AgentCard-compatible). */
    promptFor(ownerId: string): Promise<string>;
}

/** Shared team context + goals. */
export interface ISharedContextService extends ILifecycle {
    createContext(input: {
        name: string;
        scope: SharedContext['scope'];
        memberIds?: string[];
    }): Promise<SharedContext>;
    getContext(id: string): Promise<SharedContext | null>;
    listContexts(scopeRef?: string): Promise<SharedContext[]>;
    addEntry(
        contextId: string,
        kind: ContextEntryKind,
        body: string,
        opts?: { title?: string; ref?: string; authorId?: string },
    ): Promise<ContextEntry>;
    listEntries(contextId: string): Promise<ContextEntry[]>;
    shareWith(contextId: string, memberId: string): Promise<SharedContext>;

    createGoal(input: {
        ownerId: string;
        title: string;
        level?: Goal['level'];
        description?: string;
        contextId?: string;
    }): Promise<Goal>;
    updateProgress(goalId: string, progress: number): Promise<Goal>;
    setGoalStatus(goalId: string, status: GoalStatus): Promise<Goal>;
    listGoals(ownerId?: string): Promise<Goal[]>;
}
