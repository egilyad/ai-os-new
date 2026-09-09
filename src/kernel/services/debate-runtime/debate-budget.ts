import { EVENTS } from '../../events/event-names';
import type {
    DebateBudgetLimits,
    PressureLevel,
    PressureAction,
    BudgetSnapshot,
    IDebateBudget,
} from '../../contracts/debate-runtime';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('DebateBudget');

const DEFAULT_LIMITS: DebateBudgetLimits = {
    maxTokensPerDebate: 500_000,
    maxCostPerDebate: 10.0,
    maxRounds: 20,
    maxConcurrency: 8,
    maxDurationMs: 3_600_000,
};

const PRESSURE_THRESHOLDS = [
    {
        level: 'critical' as PressureLevel,
        tokenPct: 0.95,
        costPct: 0.95,
        roundPct: 0.9,
        durationPct: 0.9,
    },
    {
        level: 'high' as PressureLevel,
        tokenPct: 0.8,
        costPct: 0.8,
        roundPct: 0.75,
        durationPct: 0.75,
    },
    {
        level: 'normal' as PressureLevel,
        tokenPct: 0.5,
        costPct: 0.5,
        roundPct: 0.5,
        durationPct: 0.5,
    },
];

const PRESSURE_ACTIONS: Record<PressureLevel, PressureAction> = {
    low: {
        level: 'low',
        reduceRounds: 0,
        downgradeModels: false,
        trimContext: false,
        reduceTopologyDepth: false,
    },
    normal: {
        level: 'normal',
        reduceRounds: 0,
        downgradeModels: false,
        trimContext: false,
        reduceTopologyDepth: false,
    },
    high: {
        level: 'high',
        reduceRounds: 2,
        downgradeModels: true,
        trimContext: true,
        reduceTopologyDepth: false,
    },
    critical: {
        level: 'critical',
        reduceRounds: 4,
        downgradeModels: true,
        trimContext: true,
        reduceTopologyDepth: true,
    },
};

export class DebateBudget implements IDebateBudget {
    private limits: DebateBudgetLimits;
    private _tokensUsed = 0;
    private _costUsed = 0;
    private _roundsUsed = 0;
    private _startedAt: number;
    private _sessionId: string;
    private emit?: (event: string, data?: unknown) => void;
    // Queue-based mutex prevents TOCTOU: check-and-set is atomic within the lock.
    // Unlike the previous spin-lock, this has no race between the while-check and assignment.
    private _locked = false;
    private _lockQueue: Array<() => void> = [];

    constructor(
        sessionId: string,
        limits?: Partial<DebateBudgetLimits>,
        eventBus?: { emit: (event: string, data?: unknown) => void },
    ) {
        this._sessionId = sessionId;
        this.limits = {
            ...DEFAULT_LIMITS,
            ...limits,
            // Prevent undefined or 0 from overriding defaults via spread
            maxRounds: (limits?.maxRounds ?? DEFAULT_LIMITS.maxRounds) || DEFAULT_LIMITS.maxRounds,
            maxTokensPerDebate: limits?.maxTokensPerDebate ?? DEFAULT_LIMITS.maxTokensPerDebate,
            maxCostPerDebate: limits?.maxCostPerDebate ?? DEFAULT_LIMITS.maxCostPerDebate,
            maxConcurrency: limits?.maxConcurrency ?? DEFAULT_LIMITS.maxConcurrency,
            maxDurationMs: limits?.maxDurationMs ?? DEFAULT_LIMITS.maxDurationMs,
        };
        this._startedAt = Date.now();
        this.emit = eventBus?.emit;
    }

    private sanityReset(): void {
        // Guard: if counters exceed limits (stale budget reuse or corruption),
        // reset to zero rather than blocking all agent calls.
        if (this._tokensUsed > this.limits.maxTokensPerDebate) {
            LOGGER.warn(
                'DebateBudget',
                `stale token counter ${this._tokensUsed} > limit — resetting`,
                {
                    sessionId: this._sessionId,
                },
            );
            this._tokensUsed = 0;
        }
        if (this._costUsed > this.limits.maxCostPerDebate) {
            LOGGER.warn(
                'DebateBudget',
                `stale cost counter ${this._costUsed} > limit — resetting`,
                {
                    sessionId: this._sessionId,
                },
            );
            this._costUsed = 0;
        }
        // Duration sanity: if _startedAt is somehow in the past (epoch 0, or
        // very old from a stale budget), reset it to now so the duration
        // check doesn't immediately reject.
        const elapsed = Date.now() - this._startedAt;
        if (elapsed < 0 || elapsed > this.limits.maxDurationMs * 10) {
            LOGGER.warn(
                'DebateBudget',
                `stale _startedAt ${this._startedAt} (elapsed ${elapsed}ms) — resetting to now`,
                { sessionId: this._sessionId },
            );
            this._startedAt = Date.now();
        }
    }

    private async acquireLock(): Promise<() => void> {
        while (this._locked) {
            await new Promise<void>((resolve) => this._lockQueue.push(resolve));
        }
        this._locked = true;
        return () => {
            this._locked = false;
            this._lockQueue.shift()?.();
        };
    }

    async reserveAndRecord(
        sessionId: string,
        estimatedTokens: number,
        estimatedCost: number,
    ): Promise<boolean> {
        this.sanityReset();
        if (sessionId !== this._sessionId) {
            // This guard prevents budget reuse across sessions. If it fires on the first
            // round, the budget's _sessionId was set during new DebateBudget(id) but the
            // caller passes a different id — likely a closure mismatch in createAgentExecutor.
            LOGGER.warn(
                'DebateBudget',
                `sessionId mismatch: expected ${this._sessionId}, got ${sessionId} — caller sessionId doesn't match budget owner`,
            );
            return false;
        }
        const release = await this.acquireLock();
        try {
            if (this._tokensUsed + estimatedTokens > this.limits.maxTokensPerDebate) {
                LOGGER.warn(
                    'DebateBudget',
                    `REJECT: tokens ${this._tokensUsed}+${estimatedTokens} > ${this.limits.maxTokensPerDebate}`,
                    {
                        sessionId,
                        tokensUsed: this._tokensUsed,
                        estimatedTokens,
                        limit: this.limits.maxTokensPerDebate,
                    },
                );
                this.emit?.(EVENTS.DEBATE_BUDGET_EXCEEDED, {
                    sessionId,
                    reason: 'tokens',
                    limit: this.limits.maxTokensPerDebate,
                    used: this._tokensUsed,
                });
                return false;
            }
            if (this._costUsed + estimatedCost > this.limits.maxCostPerDebate) {
                LOGGER.warn(
                    'DebateBudget',
                    `REJECT: cost ${this._costUsed}+${estimatedCost} > ${this.limits.maxCostPerDebate}`,
                    {
                        sessionId,
                        costUsed: this._costUsed,
                        estimatedCost,
                        limit: this.limits.maxCostPerDebate,
                    },
                );
                this.emit?.(EVENTS.DEBATE_BUDGET_EXCEEDED, {
                    sessionId,
                    reason: 'cost',
                    limit: this.limits.maxCostPerDebate,
                    used: this._costUsed,
                });
                return false;
            }
            if (this._roundsUsed > this.limits.maxRounds) {
                LOGGER.warn(
                    'DebateBudget',
                    `REJECT: rounds ${this._roundsUsed} > ${this.limits.maxRounds}`,
                    { sessionId, roundsUsed: this._roundsUsed, limit: this.limits.maxRounds },
                );
                this.emit?.(EVENTS.DEBATE_BUDGET_EXCEEDED, {
                    sessionId,
                    reason: 'rounds',
                    limit: this.limits.maxRounds,
                    used: this._roundsUsed,
                });
                return false;
            }
            const elapsed = Date.now() - this._startedAt;
            if (elapsed >= this.limits.maxDurationMs) {
                LOGGER.warn(
                    'DebateBudget',
                    `REJECT: duration ${elapsed}ms >= ${this.limits.maxDurationMs}ms`,
                    {
                        sessionId,
                        elapsed,
                        _startedAt: this._startedAt,
                        limit: this.limits.maxDurationMs,
                    },
                );
                this.emit?.(EVENTS.DEBATE_BUDGET_EXCEEDED, {
                    sessionId,
                    reason: 'duration',
                    limit: this.limits.maxDurationMs,
                    used: elapsed,
                });
                return false;
            }
            LOGGER.debug(
                'DebateBudget',
                `ALLOWED: tokens ${this._tokensUsed}+${estimatedTokens}, cost ${this._costUsed}+${estimatedCost}, rounds ${this._roundsUsed}, elapsed ${elapsed}ms`,
                {
                    sessionId,
                    tokensUsed: this._tokensUsed,
                    estimatedTokens,
                    costUsed: this._costUsed,
                    estimatedCost,
                    roundsUsed: this._roundsUsed,
                    elapsed,
                },
            );
            this._tokensUsed += estimatedTokens;
            this._costUsed += estimatedCost;
            return true;
        } finally {
            release();
        }
    }

    destroy(): void {
        for (const resolve of this._lockQueue) resolve();
        this._lockQueue = [];
        this._locked = false;
        this.emit = undefined;
    }

    incrementRound(sessionId: string): void {
        if (sessionId !== this._sessionId) {
            LOGGER.warn(
                'DebateBudget',
                `incrementRound sessionId mismatch: expected ${this._sessionId}, got ${sessionId}`,
            );
            return;
        }
        // Don't increment beyond the limit — prevents fencepost where
        // incrementRound (called at round:start) makes _roundsUsed equal
        // maxRounds, causing the next reserveAndRecord check to reject
        // agents in the last allowed round.
        if (this._roundsUsed >= this.limits.maxRounds) {
            LOGGER.debug(
                'DebateBudget',
                `incrementRound: already at limit ${this.limits.maxRounds}, skipping`,
                { sessionId, roundsUsed: this._roundsUsed },
            );
            return;
        }
        this._roundsUsed++;
    }

    getPressure(): PressureLevel {
        const tokenPct = this._tokensUsed / this.limits.maxTokensPerDebate;
        const costPct = this._costUsed / this.limits.maxCostPerDebate;
        const roundPct = this._roundsUsed / this.limits.maxRounds;
        const durationPct = (Date.now() - this._startedAt) / this.limits.maxDurationMs;

        for (const t of PRESSURE_THRESHOLDS) {
            if (
                tokenPct >= t.tokenPct ||
                costPct >= t.costPct ||
                roundPct >= t.roundPct ||
                durationPct >= t.durationPct
            ) {
                return t.level;
            }
        }
        return 'low';
    }

    getPressureAction(): PressureAction {
        const level = this.getPressure();
        return { ...PRESSURE_ACTIONS[level] };
    }

    snapshot(): BudgetSnapshot {
        const level = this.getPressure();
        return {
            sessionId: this._sessionId,
            tokensUsed: this._tokensUsed,
            costUsed: this._costUsed,
            roundsUsed: this._roundsUsed,
            durationMs: Date.now() - this._startedAt,
            pressure: level,
            estimatedRemainingTokens: Math.max(
                0,
                this.limits.maxTokensPerDebate - this._tokensUsed,
            ),
            estimatedRemainingCost: Math.max(0, this.limits.maxCostPerDebate - this._costUsed),
        };
    }
}
