import type { DebatePhase } from './debate-types';

export type TransitionEvent =
    | 'QUEUE'
    | 'INITIALIZE'
    | 'ACTIVATE'
    | 'BEGIN_ROUND'
    | 'CONCLUDE'
    | 'SUMMARIZE'
    | 'FINISH'
    | 'PAUSE'
    | 'RESUME'
    | 'FAIL'
    | 'CANCEL'
    | 'ABORT'
    | 'TIMEOUT'
    | 'RESET';

export interface TransitionOutcome {
    readonly success: boolean;
    readonly from: DebatePhase;
    readonly to: DebatePhase | null;
    readonly event: TransitionEvent;
    readonly reason?: string;
}

export type TransitionGuard = (
    from: DebatePhase,
    to: DebatePhase,
    event: TransitionEvent,
) => boolean | Promise<boolean>;

export type TransitionHook = (
    from: DebatePhase,
    to: DebatePhase,
    event: TransitionEvent,
) => void | Promise<void>;

export interface IStateMachine {
    readonly current: DebatePhase;
    send(event: TransitionEvent): Promise<TransitionOutcome>;
    can(event: TransitionEvent): boolean;
    guard(event: TransitionEvent, reason?: string): Error;
    onBeforeTransition(hook: TransitionHook): () => void;
    onAfterTransition(hook: TransitionHook): () => void;
    onInvalidTransition(
        hook: (event: TransitionEvent, from: DebatePhase, target: DebatePhase | null) => void,
    ): () => void;
    onError(hook: (event: TransitionEvent, from: DebatePhase, error: Error) => void): () => void;
    addGuard(guard: TransitionGuard): () => void;
    reset(to?: DebatePhase): void;
    destroy(): void;
}
