import type { DebatePhase } from '../../contracts/debate-types';
import type {
    TransitionEvent,
    TransitionOutcome,
    TransitionGuard,
    TransitionHook,
    IStateMachine,
} from '../../contracts/debate-state-machine';

const TRANSITION_TABLE: Record<DebatePhase, Partial<Record<TransitionEvent, DebatePhase>>> = {
    created: { QUEUE: 'queued', FAIL: 'failed', CANCEL: 'cancelled', ABORT: 'cancelled' },
    queued: {
        INITIALIZE: 'initializing',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    initializing: {
        ACTIVATE: 'active',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    active: {
        BEGIN_ROUND: 'deliberating',
        PAUSE: 'paused',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    deliberating: {
        BEGIN_ROUND: 'deliberating',
        CONCLUDE: 'consensus',
        PAUSE: 'paused',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
        TIMEOUT: 'failed',
    },
    paused: {
        RESUME: 'queued',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    consensus: {
        SUMMARIZE: 'summarizing',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    summarizing: {
        FINISH: 'completed',
        FAIL: 'failed',
        CANCEL: 'cancelled',
        ABORT: 'cancelled',
    },
    completed: {
        RESET: 'created',
        CANCEL: 'cancelled',
    },
    failed: {
        RESET: 'created',
        CANCEL: 'cancelled',
    },
    cancelled: {
        RESET: 'created',
    },
};

const TERMINAL_STATES: ReadonlySet<DebatePhase> = new Set(['completed', 'failed', 'cancelled']);

export class StateMachine implements IStateMachine {
    private _current: DebatePhase;
    private _beforeHooks: TransitionHook[] = [];
    private _afterHooks: TransitionHook[] = [];
    private _invalidHooks: Array<
        (event: TransitionEvent, from: DebatePhase, target: DebatePhase | null) => void
    > = [];
    private _errorHooks: Array<(event: TransitionEvent, from: DebatePhase, error: Error) => void> =
        [];
    private _guards: TransitionGuard[] = [];
    private _sending = false;

    constructor(initial: DebatePhase = 'created') {
        this._current = initial;
    }

    get current(): DebatePhase {
        return this._current;
    }

    can(event: TransitionEvent): boolean {
        const row = TRANSITION_TABLE[this._current];
        return row != null && event in row;
    }

    guard(event: TransitionEvent, reason?: string): Error {
        const row = TRANSITION_TABLE[this._current];
        if (!row || !(event in row)) {
            return new Error(
                reason ?? `Invalid transition: ${this._current} cannot accept ${event}`,
            );
        }
        const target = row[event]!;
        if (TERMINAL_STATES.has(this._current) && this._current === target) {
            return new Error(
                reason ?? `Idempotent transition blocked: ${this._current} already in ${target}`,
            );
        }
        if (this._current === target) {
            return new Error(
                reason ??
                    `Self-loop blocked: ${this._current} → ${target} is a no-op for event ${event}`,
            );
        }
        return null as unknown as Error;
    }

    async send(event: TransitionEvent): Promise<TransitionOutcome> {
        const from = this._current;
        const row = TRANSITION_TABLE[from];

        if (this._sending) {
            return {
                success: false,
                from,
                to: null,
                event,
                reason: 'Re-entrant send() blocked — state machine busy',
            };
        }

        if (!row || !(event in row)) {
            const reason = `Invalid transition: ${from} has no rule for ${event}`;
            for (const h of this._invalidHooks) h(event, from, null);
            return { success: false, from, to: null, event, reason };
        }

        const target = row[event]!;

        for (const g of this._guards) {
            try {
                const ok = await g(from, target, event);
                if (!ok) {
                    const reason = `Guard rejected: ${from} → ${target} via ${event}`;
                    for (const h of this._invalidHooks) h(event, from, target);
                    return { success: false, from, to: target, event, reason };
                }
            } catch (e) {
                const reason = `Guard threw: ${e instanceof Error ? e.message : String(e)}`;
                const err = e instanceof Error ? e : new Error(String(e));
                for (const h of this._errorHooks) h(event, from, err);
                return { success: false, from, to: target, event, reason };
            }
        }

        this._sending = true;
        try {
            for (const h of this._beforeHooks) {
                try {
                    await h(from, target, event);
                } catch (e) {
                    const reason = `beforeTransition hook threw: ${e instanceof Error ? e.message : String(e)}`;
                    const err = e instanceof Error ? e : new Error(String(e));
                    for (const eh of this._errorHooks) eh(event, from, err);
                    return { success: false, from, to: target, event, reason };
                }
            }

            this._current = target;

            for (const h of this._afterHooks) {
                try {
                    await h(from, target, event);
                } catch (e) {
                    const reason = `afterTransition hook threw: ${e instanceof Error ? e.message : String(e)}`;
                    const err = e instanceof Error ? e : new Error(String(e));
                    for (const eh of this._errorHooks) eh(event, from, err);
                    return { success: false, from, to: target, event, reason };
                }
            }

            return { success: true, from, to: target, event };
        } finally {
            this._sending = false;
        }
    }

    onBeforeTransition(hook: TransitionHook): () => void {
        this._beforeHooks.push(hook);
        return () => {
            this._beforeHooks = this._beforeHooks.filter((h) => h !== hook);
        };
    }

    onAfterTransition(hook: TransitionHook): () => void {
        this._afterHooks.push(hook);
        return () => {
            this._afterHooks = this._afterHooks.filter((h) => h !== hook);
        };
    }

    onInvalidTransition(
        hook: (event: TransitionEvent, from: DebatePhase, target: DebatePhase | null) => void,
    ): () => void {
        this._invalidHooks.push(
            hook as (event: TransitionEvent, from: DebatePhase, target: DebatePhase | null) => void,
        );
        return () => {
            this._invalidHooks = this._invalidHooks.filter((h) => h !== hook);
        };
    }

    onError(hook: (event: TransitionEvent, from: DebatePhase, error: Error) => void): () => void {
        this._errorHooks.push(hook);
        return () => {
            this._errorHooks = this._errorHooks.filter((h) => h !== hook);
        };
    }

    addGuard(guard: TransitionGuard): () => void {
        this._guards.push(guard);
        return () => {
            this._guards = this._guards.filter((g) => g !== guard);
        };
    }

    reset(to: DebatePhase = 'created'): void {
        this._current = to;
    }

    destroy(): void {
        this._beforeHooks = [];
        this._afterHooks = [];
        this._invalidHooks = [];
        this._errorHooks = [];
        this._guards = [];
        this._sending = false;
    }
}

const PHASE_TO_EVENT: Record<string, TransitionEvent> = {
    queued: 'QUEUE',
    initializing: 'INITIALIZE',
    active: 'ACTIVATE',
    deliberating: 'BEGIN_ROUND',
    consensus: 'CONCLUDE',
    summarizing: 'SUMMARIZE',
    completed: 'FINISH',
    paused: 'PAUSE',
    failed: 'FAIL',
    cancelled: 'CANCEL',
};

export function phaseToEvent(phase: DebatePhase): TransitionEvent | null {
    return PHASE_TO_EVENT[phase] ?? null;
}

export function createStateMachine(initial: DebatePhase = 'created'): IStateMachine {
    return new StateMachine(initial);
}
