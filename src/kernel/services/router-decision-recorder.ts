import type { ApiKey, SystemState } from '../types/metrics-types';

import type {
    SkippedKeyEntry,
    RouterDecision,
    RoutingStrategy,
    RequestClassification,
} from './router-types';
import { getEffectiveWeights } from './router-scoring';
import type { WeightProfile } from '../types/routing-types';

export interface DecisionRecorderDeps {
    kernel: {
        getState: () => SystemState;
    };
    keyService: {
        getKey: (id: string) => ApiKey | undefined;
    };
    getActiveProfile: () => WeightProfile;
    // 9.13: optional KV for history survival across restarts.
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

const HISTORY_KEY = 'router_decision_history';

export class RouterDecisionRecorder {
    private lastDecisions: RouterDecision[] = [];
    private readonly MAX_DECISIONS = 30;
    private persistTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private deps: DecisionRecorderDeps) {}

    /** Restore the ring after restart (best-effort, never throws). */
    async restore(): Promise<void> {
        if (!this.deps.database) return;
        try {
            const saved = await this.deps.database.getKv<RouterDecision[]>(HISTORY_KEY);
            if (Array.isArray(saved) && saved.length > 0) {
                this.lastDecisions = saved.slice(0, this.MAX_DECISIONS);
            }
        } catch {
            /* corrupted entry — start fresh */
        }
    }

    private schedulePersist(): void {
        if (!this.deps.database) return;
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            this.persistTimer = null;
            this.deps
                .database!.setKv(HISTORY_KEY, this.lastDecisions)
                .catch(() => {
                    /* quota loss — memory ring survives */
                });
        }, 2000);
    }

    getSelectionTrace(keyId?: string): readonly RouterDecision[] {
        if (!keyId) return this.lastDecisions;
        const key = this.deps.keyService.getKey(keyId);
        return this.lastDecisions.filter(
            (d) =>
                d.skipped.some((s) => s.keyId === keyId) ||
                (key !== undefined && d.selected === key.provider) ||
                (key !== undefined && d.secondBest === key.provider) ||
                (key !== undefined && d.scores.some((s) => s.provider === key.provider)),
        );
    }

    logDebateSkip(
        key: ApiKey,
        reason: string,
        stage: SkippedKeyEntry['stage'],
        classification?: Partial<RequestClassification>,
    ): void {
        this.lastDecisions.unshift({
            requestId: crypto.randomUUID(),
            strategy: 'latency',
            classification: {
                complexity: classification?.complexity ?? 'simple',
                isCode: classification?.isCode ?? false,
                isLong: classification?.isLong ?? false,
                isMultimodal: classification?.isMultimodal ?? false,
                intent: classification?.intent ?? 'general',
                language: classification?.language ?? 'en',
            },
            weights: getEffectiveWeights(
                'latency',
                '',
                this.deps.kernel.getState(),
                this.deps.getActiveProfile(),
            ),
            selected: '',
            secondBest: null,
            scores: [],
            skipped: [
                { provider: key.provider, keyLabel: key.label, keyId: key.id, reason, stage },
            ],
            steps: [
                {
                    name: `${stage}:check`,
                    status: 'blocked',
                    provider: key.provider,
                    detail: reason,
                },
            ],
            timestamp: Date.now(),
            promptLength: 0,
            origin: 'live',
        });
        this.schedulePersist();
    }

    recordDecision(opts: {
        strategy: RoutingStrategy;
        skipped: SkippedKeyEntry[];
        selected: string;
        prompt: string;
        classification?: Partial<RequestClassification>;
    }): void {
        this.lastDecisions.unshift({
            requestId: crypto.randomUUID(),
            strategy: opts.strategy,
            classification: {
                complexity: opts.classification?.complexity ?? 'simple',
                isCode: opts.classification?.isCode ?? false,
                isLong: opts.classification?.isLong ?? false,
                isMultimodal: opts.classification?.isMultimodal ?? false,
                intent: opts.classification?.intent ?? 'general',
                language: opts.classification?.language ?? 'en',
            },
            weights: getEffectiveWeights(
                opts.strategy,
                opts.prompt,
                this.deps.kernel.getState(),
                this.deps.getActiveProfile(),
            ),
            selected: opts.selected,
            secondBest: null,
            scores: [],
            skipped: opts.skipped,
            steps:
                opts.skipped.length > 0
                    ? opts.skipped.slice(0, 5).map((s) => ({
                          name: `${s.stage}:check` as const,
                          status: 'blocked' as const,
                          provider: s.provider,
                          detail: s.reason,
                      }))
                    : [{ name: 'scoring', status: 'passed', detail: 'Auto-selected (free-tier)' }],
            timestamp: Date.now(),
            promptLength: opts.prompt.length,
            origin: 'live',
        });
        if (this.lastDecisions.length > this.MAX_DECISIONS) this.lastDecisions.pop();
        this.schedulePersist();
    }
}
