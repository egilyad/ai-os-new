/**
 * Crew + Task + Process domain types (Roadmap Wave 1.1).
 *
 * CrewAI-style team layer on top of the existing architecture:
 *   AgentRole (Role + Goal + Backstory) -> Task -> Crew + Process.
 *
 * Persistence: Dexie tables `crews` + `crewTasks` (v23).
 * Communication: only via EventBus (`crew:*`, `task:*`).
 */

export type CrewProcess = 'sequential' | 'hierarchical' | 'consensual';

export type CrewStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'failed' | 'aborted';

export type CrewTaskStatus = 'pending' | 'running' | 'awaiting_human' | 'completed' | 'failed' | 'skipped';

/** AgentRole — role + goal + backstory (CrewAI `Agent` equivalent). */
export interface AgentRole {
    id: string;
    name: string;
    role: string;
    goal: string;
    backstory: string;
    /** Optional link to a registered agent id (agentService) or role id (roleService). */
    agentId?: string;
    tools?: string[];
    /** If false the agent cannot delegate (hierarchical process respects this). */
    allowDelegation?: boolean;
    maxIter?: number;
    createdAt: number;
    updatedAt: number;
}

/** Agent Card / Identity — portable persona standard (Roadmap 1.2, openagent-inspired). */
export interface AgentCard {
    id: string;
    name: string;
    role: string;
    /** Communication style, e.g. "socratic, concise". */
    style?: string;
    /** Voice/tone descriptor for TTS / chat rendering. */
    voice?: string;
    skills?: string[];
    limitations?: string[];
    goal?: string;
    backstory?: string;
    version: number;
    createdAt: number;
    updatedAt: number;
}

/** Task — unit of work assigned to one AgentRole (CrewAI `Task` equivalent). */
export interface CrewTask {
    id: string;
    crewId: string;
    description: string;
    expectedOutput: string;
    /** AgentRole id responsible for this task. */
    assigneeId: string;
    /** JSON-schema-ish hint for the output shape (kept as free-form record). */
    outputSchema?: Record<string, unknown>;
    /** Task ids whose outputs are prepended as explicit context (CrewAI `context`). */
    contextTaskIds?: string[];
    /** When true the crew pauses here until a human submits the output. */
    humanInput?: boolean;
    status: CrewTaskStatus;
    /** Ordered dependencies — task ids that must complete first. */
    dependsOn?: string[];
    output?: string;
    error?: string;
    startedAt?: number;
    completedAt?: number;
    createdAt: number;
    updatedAt: number;
}

/** Crew — a team of AgentRoles + ordered tasks + process. */
export interface Crew {
    id: string;
    name: string;
    description?: string;
    process: CrewProcess;
    /** Leader role id for hierarchical process. */
    managerId?: string;
    roles: AgentRole[];
    /** Task ids in execution order (source of truth lives in `crewTasks` table). */
    taskIds: string[];
    status: CrewStatus;
    /** Id of the currently running task (if any). */
    currentTaskId?: string;
    createdAt: number;
    updatedAt: number;
}

/** Dexie row for `crews` — Crew stored as-is (roles embedded, tasks referenced). */
export interface CrewRecord {
    id: string;
    name: string;
    description?: string;
    process: CrewProcess;
    managerId?: string;
    roles: AgentRole[];
    taskIds: string[];
    status: CrewStatus;
    currentTaskId?: string;
    createdAt: number;
    updatedAt: number;
}

/** Dexie row for `crewTasks`. */
export interface CrewTaskRecord {
    id: string;
    crewId: string;
    description: string;
    expectedOutput: string;
    assigneeId: string;
    outputSchema?: Record<string, unknown>;
    contextTaskIds?: string[];
    humanInput?: boolean;
    status: CrewTaskStatus;
    dependsOn?: string[];
    output?: string;
    error?: string;
    startedAt?: number;
    completedAt?: number;
    createdAt: number;
    updatedAt: number;
}
