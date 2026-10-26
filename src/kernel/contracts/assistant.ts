/**
 * Assistant contracts — the project assistant ("помощник по проекту").
 *
 * The assistant is a normal agent with a special toolset: instead of calling
 * LLM APIs directly it uses *actions* — declarative, permission-checked
 * operations over the running system (research, navigation, work,
 * coordination). Every action returns a verifiable result, so the assistant
 * can state what actually happened instead of what it intended to do.
 */

/** What kind of work an action performs — mirrors the tool groups. */
export type AssistantActionGroup = 'research' | 'navigation' | 'work' | 'coordination';

/**
 * Trust level of a capability (see the design note):
 *  - declared   — the documentation says the system can do it;
 *  - discovered — the implementation was found in the code;
 *  - verified   — the action actually ran and the result was observed.
 */
export type AssistantVerification = 'declared' | 'discovered' | 'verified';

export interface AssistantActionResult {
    /** Did the action succeed? */
    ok: boolean;
    /** Short human-readable outcome. */
    detail: string;
    /**
     * The verifiable part: what was observed (a route, an id, a count).
     * The assistant must not claim more than this shows.
     */
    evidence?: string;
    /** Trust level of the executed capability. */
    verification?: AssistantVerification;
}

export interface AssistantAction {
    id: string;
    group: AssistantActionGroup;
    /** What the action does — becomes the tool description. */
    description: string;
    /** JSON schema of the parameters (OpenAI function-call shape). */
    parameters: Record<string, unknown>;
    /** Permission class the waterfall checks. */
    action: 'tool:read' | 'tool:write' | 'tool:exec' | 'tool:net' | 'tool:mcp' | 'tool:memory';
    /** Run the action. Must not throw — return a failed result instead. */
    run(args: Record<string, unknown>): Promise<AssistantActionResult>;
}

/** A navigation request from the assistant to the UI. */
export interface AssistantNavigationRequest {
    id: string;
    /** Route to open. */
    route: string;
    /** Optional extra state for the target panel. */
    params?: Record<string, unknown>;
    reason: string;
    createdAt: number;
}

export interface AssistantTurnRequest {
    /** The user's question or command. */
    text: string;
    /** Chat session the turn belongs to. */
    sessionId?: string;
    /** Agent id the assistant runs as (its own identity). */
    agentId?: string;
    /** Provider/model override; the assistant uses the session default. */
    provider?: string;
    model?: string;
    /** Pin this turn to a specific key (by id) instead of auto-routing. */
    keyId?: string;
}

export interface AssistantTurnResult {
    /** The assistant's answer. */
    content: string;
    /** Tools that were called during the turn. */
    toolCalls: string[];
    /** Round-trips with the model. */
    rounds: number;
}

/* ------------------------------------------------------------------- diary */

/** What kind of experience the assistant records. */
export type AssistantDiaryKind =
    | 'question'
    | 'action'
    | 'decision'
    | 'mistake'
    | 'lesson'
    | 'answer';

export interface AssistantDiaryEntry {
    id: string;
    kind: AssistantDiaryKind;
    /** What happened, in one sentence. */
    text: string;
    /** What was actually observed. */
    evidence?: string;
    outcome: 'success' | 'failure' | 'partial' | 'in_progress';
    tags: string[];
    timestamp: number;
}

/* ------------------------------------------------------------------- exam */

/**
 * The verdict of the self-check.
 *
 * The assistant may only state a capability as working when the exam passed
 * with a `verified` level. A `declared` capability is documentation, not a
 * fact.
 */
export interface AssistantExamVerdict {
    capabilityId: string;
    /** May the assistant claim it works? */
    passed: boolean;
    level: 'declared' | 'discovered' | 'verified';
    evidence: string[];
    reason: string;
    /** What would raise the level. */
    nextStep: string;
}
