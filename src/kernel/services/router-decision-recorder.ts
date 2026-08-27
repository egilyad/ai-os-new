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
}

export class RouterDecisionRecorder {
    private lastDecisions: RouterDecision[] = [];
    private readonly MAX_DECISIONS = 30;

    constructor(private deps: DecisionRecorderDeps) {}

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
    }
}
