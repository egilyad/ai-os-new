import type { ConversationScenario } from './scenario';
import type { TurnProposal } from './turn';
import type { TurnResult } from './execution';
import type { ConversationSession, SessionCheckpoint } from './session';

/**
 * Runtime state of a managed conversation directed by
 * `ConversationDirectorService`. The service owns the lifecycle; the UI/store
 * (added later) will only observe this state — it must not drive orchestration.
 */
export type DirectorState = 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'error';

/**
 * Admin Conversation Director — generic runtime service.
 *
 * Binds a persisted `ConversationScenario` to the generic ConversationCore
 * chain:
 *
 *   ConversationScenario → HybridPolicy → ConversationOrchestrator → IExecutionEngine
 *
 * It does NOT know about Debate, Forum, rounds, bids or consensus. It does NOT
 * own any UI/React state and does NOT touch Dexie directly (it loads scenarios
 * through the `ScenarioRepository` DAL boundary).
 */
export interface IConversationDirectorService {
    /** Load a scenario by id and (re)build the HybridPolicy + Orchestrator. Throws if not found. */
    loadScenario(id: string, invocationId?: string): Promise<ConversationScenario>;
    /** Run the full scenario to completion (or until paused/aborted). */
    run(): Promise<void>;
    pause(): void;
    resume(): Promise<void>;
    abort(): void;
    /** Drop the next planned turn. */
    skipNext(): void;
    /** Insert/edit a turn that runs next, without consuming the plan cursor. */
    overrideTurn(proposal: TurnProposal): void;
    getState(): DirectorState;
    getResults(): TurnResult[];
    getScenario(): ConversationScenario | undefined;
    /**
     * The live `ConversationSession` for the currently loaded run, or undefined
     * if no scenario has been loaded. This is the run record — distinct from the
     * static scenario blueprint — carrying events, checkpoints and progress.
     */
    getSession(): ConversationSession | undefined;
    /** Capture a named snapshot of the live run into the session's checkpoints. */
    checkpoint(label?: string): string;
    /** List the checkpoints captured for the current session. */
    getCheckpoints(): SessionCheckpoint[];
}
