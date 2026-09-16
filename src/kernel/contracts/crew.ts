import type { ILifecycle } from './lifecycle';
import type {
    AgentCard,
    AgentRole,
    Crew,
    CrewProcess,
    CrewTask,
    CrewTaskStatus,
} from '../types/crew-types';

export type {
    AgentCard,
    AgentRole,
    Crew,
    CrewProcess,
    CrewTask,
    CrewTaskStatus,
} from '../types/crew-types';

export interface CreateRoleInput {
    name: string;
    role: string;
    goal: string;
    backstory: string;
    agentId?: string;
    tools?: string[];
    allowDelegation?: boolean;
    maxIter?: number;
}

export interface CreateTaskInput {
    description: string;
    expectedOutput: string;
    assigneeId: string;
    outputSchema?: Record<string, unknown>;
    dependsOn?: string[];
    /** Explicit context tasks (CrewAI `context`) — outputs prepended to this task's context. */
    contextTaskIds?: string[];
    /** Pause the crew here until a human submits the output (CrewAI `human_input`). */
    humanInput?: boolean;
}

export interface CreateCrewInput {
    name: string;
    description?: string;
    process?: CrewProcess;
    managerId?: string;
    roles?: CreateRoleInput[];
    tasks?: CreateTaskInput[];
}

export interface CrewRunResult {
    crewId: string;
    status: 'completed' | 'failed' | 'aborted' | 'paused';
    outputs: Record<string, string>;
    startedAt: number;
    completedAt: number;
}

/** Executes a single task — injected so CrewService stays LLM-agnostic. */
export interface ICrewTaskExecutor {
    execute(input: {
        crew: Crew;
        task: CrewTask;
        role: AgentRole;
        context: string;
    }): Promise<string>;
}

/**
 * CrewService — Wave 1.1 foundation (CrewAI-style, local-first).
 *
 * All mutations persist to IndexedDB (via CrewRepository/DAL) and emit
 * `crew:*` / `task:*` events. No direct LLM calls — execution goes through
 * the injected `ICrewTaskExecutor` (default: deterministic echo, real LLM
 * wiring is a later wave).
 */
export interface ICrewService extends ILifecycle {
    createCrew(input: CreateCrewInput): Promise<Crew>;
    getCrew(id: string): Promise<Crew | null>;
    listCrews(): Promise<Crew[]>;
    deleteCrew(id: string): Promise<void>;

    addRole(crewId: string, input: CreateRoleInput): Promise<AgentRole>;
    removeRole(crewId: string, roleId: string): Promise<void>;

    addTask(crewId: string, input: CreateTaskInput): Promise<CrewTask>;
    listTasks(crewId: string): Promise<CrewTask[]>;
    getTask(taskId: string): Promise<CrewTask | null>;

    /** Sequential / hierarchical / consensual run over the crew's tasks. */
    startCrew(crewId: string): Promise<CrewRunResult>;
    abortCrew(crewId: string): Promise<void>;

    // ── GAP E.3: human-in-task, replay, test ──
    /** Human submits the output for an `awaiting_human` task, then the crew resumes. */
    submitHumanTask(crewId: string, taskId: string, output: string): Promise<CrewRunResult>;
    /** Resume a paused crew (all human inputs already submitted). */
    resumeCrew(crewId: string): Promise<CrewRunResult>;
    /** Reset task states to pending (optionally from one task onward) for replay/test. */
    resetTasks(crewId: string, fromTaskId?: string): Promise<void>;

    // ── Agent Card / Identity (Wave 1.2) ──
    cardFromRole(role: AgentRole): AgentCard;
    roleFromCard(card: AgentCard): CreateRoleInput;
    exportCard(card: AgentCard): string;
    importCard(json: string): AgentCard;
    validateCard(card: unknown): card is AgentCard;

    // ── High-level API (Wave 1.4) ──
    createCrewFromTemplate(templateId: string, overrides?: Partial<CreateCrewInput>): Promise<Crew>;
    listTemplates(): Array<{ id: string; name: string; description: string }>;
}

/** Agent Forge — proposes a Crew draft from a goal description (Wave 1.3). */
export interface ForgeProposal {
    name: string;
    description: string;
    process: CrewProcess;
    roles: CreateRoleInput[];
    tasks: CreateTaskInput[];
    reasoning: string;
}

export interface IAgentForgeService {
    propose(input: { goal: string; constraints?: string }): Promise<ForgeProposal>;
    /** Materialize a proposal into a persisted Crew. */
    materialize(proposal: ForgeProposal): Promise<Crew>;
}
