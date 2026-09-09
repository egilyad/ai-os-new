/**
 * Persona & Context domain types — Roadmap Wave 4.
 *
 * Letta-style memory hierarchy + graph memory, Person/Voice distillation,
 * TinyTroupe-inspired deep persona, team Shared Context and Goals.
 *
 * Persistence: Dexie v26 (`ltMemories`, `memoryLinks`, `personaProfiles`,
 * `personaDepths`, `sharedContexts`, `contextEntries`, `goals`).
 * Communication: EventBus only (`memory:*`, `persona:*`, `context:*`, `goal:*`).
 * Existing Memory Mesh / roles / workspace are untouched.
 */

/** Letta-style tiers: core (always in context) / recall (searchable) / archival (cold). */
export type MemoryTier = 'core' | 'recall' | 'archival';

export interface LongTermMemory {
    id: string;
    ownerId: string;
    tier: MemoryTier;
    content: string;
    tags?: string[];
    /** 0..1 — promotion threshold helper. */
    importance?: number;
    createdAt: number;
    updatedAt: number;
    lastAccessedAt?: number;
}

export type MemoryRelation =
    | 'supports'
    | 'contradicts'
    | 'elaborates'
    | 'caused_by'
    | 'relates';

export interface MemoryLink {
    id: string;
    fromId: string;
    toId: string;
    relation: MemoryRelation;
    createdAt: number;
}

/** Distilled style/judgment of a user or expert (Distilly-inspired). */
export interface PersonProfile {
    id: string;
    ownerId: string;
    displayName: string;
    /** Distilled style notes, e.g. "prefers bullets, terse". */
    styleNotes: string[];
    /** Distilled judgment patterns, e.g. "security > convenience". */
    judgments: string[];
    phrases?: string[];
    sampleCount: number;
    updatedAt: number;
    createdAt: number;
}

export interface VoiceProfile {
    id: string;
    personId: string;
    tone: string;
    pace?: string;
    vocabulary?: string[];
    doNotUse?: string[];
    sampleCount: number;
    updatedAt: number;
    createdAt: number;
}

/** Deep persona model (TinyTroupe-inspired): traits, beliefs, comm style. */
export interface PersonaDepth {
    id: string;
    /** AgentCard id / role id / crew member id this persona belongs to. */
    ownerId: string;
    traits: Record<string, number>;
    beliefs: string[];
    values?: string[];
    commStyle?: string;
    quirks?: string[];
    updatedAt: number;
    createdAt: number;
}

/** Team shared context: common memory, files, credential refs, history. */
export interface SharedContext {
    id: string;
    name: string;
    /** Scope link: crew / council / graph run / room. */
    scope: { kind: 'crew' | 'council' | 'graph' | 'room'; ref: string };
    memberIds: string[];
    createdAt: number;
    updatedAt: number;
}

export type ContextEntryKind = 'note' | 'file' | 'credential_ref' | 'history' | 'decision';

export interface ContextEntry {
    id: string;
    contextId: string;
    kind: ContextEntryKind;
    title?: string;
    body: string;
    /** For credential_ref: reference name only — NEVER the secret itself. */
    ref?: string;
    authorId?: string;
    createdAt: number;
}

export type GoalStatus = 'active' | 'paused' | 'achieved' | 'dropped';

export interface Goal {
    id: string;
    contextId?: string;
    ownerId: string;
    /** 'team' for crew/council goals, 'agent' for individual ones. */
    level: 'team' | 'agent';
    title: string;
    description?: string;
    status: GoalStatus;
    progress: number;
    createdAt: number;
    updatedAt: number;
}
