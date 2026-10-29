export interface StateMachineConfig<S extends string> {
    states: S[];
    transitions: Array<{ from: S; to: S; on: string }>;
}

export interface CheckpointStore {
    load(): Promise<unknown | undefined>;
    save(state: unknown): Promise<void>;
}

/**
 * P3-3: a minimal generic state machine with checkpoint/resume. Each accepted
 * transition persists the new state to the CheckpointStore, so a long-running
 * task can resume across reloads (e.g. after a crash) from its last checkpoint.
 * The optional checkpoint is validated against the declared states on init().
 */
export class CheckpointedStateMachine<S extends string> {
    private current: S;

    constructor(
        private readonly config: StateMachineConfig<S>,
        private readonly initial: S,
        private readonly store: CheckpointStore,
    ) {
        this.current = initial;
    }

    get state(): S {
        return this.current;
    }

    async init(): Promise<void> {
        const saved = await this.store.load();
        if (typeof saved === 'string' && this.config.states.includes(saved as S)) {
            this.current = saved as S;
        }
    }

    can(event: string): boolean {
        return this.config.transitions.some((t) => t.from === this.current && t.on === event);
    }

    async transition(event: string): Promise<S> {
        const t = this.config.transitions.find((tr) => tr.from === this.current && tr.on === event);
        if (!t) throw new Error(`Invalid transition: ${this.current} --${event}--> ?`);
        this.current = t.to;
        await this.store.save(this.current);
        return this.current;
    }
}
